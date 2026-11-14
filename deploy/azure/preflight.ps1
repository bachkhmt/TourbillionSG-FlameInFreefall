[CmdletBinding()]
param([string]$ConfigPath = "$PSScriptRoot/config.local.ps1")
. "$PSScriptRoot/common.ps1"
$c = Read-DeployConfig $ConfigPath
$sub = $c.SubscriptionId
Write-Host 'READ ONLY: no account switch, registration, provisioning or secret access.'
Invoke-AzJson @('account','show','--subscription',$sub,'--query','{id:id,name:name,state:state}') | Format-List
Invoke-AzJson @('resource','list','--subscription',$sub,'--resource-group',$c.ResourceGroup,
    '--query','[].{name:name,type:type,location:location}') | Format-Table
$scope = "/subscriptions/$sub/resourceGroups/$($c.ResourceGroup)"
$assignments = @(Invoke-AzJson @('policy','assignment','list','--subscription',$sub,
    '--scope',$scope,'--disable-scope-strict-match','true'))
foreach ($a in $assignments) {
    [pscustomobject]@{Assignment=$a.id; Definition=$a.policyDefinitionId; Enforcement=$a.enforcementMode}
    # Candidate region parameters only. Initiatives/selectors/exemptions need human review.
    if ($a.parameters) {
        foreach ($p in $a.parameters.PSObject.Properties) {
            if ($p.Name -match 'location|region') {
                Write-Host "Region parameter $($p.Name): $($p.Value.value -join ', ')"
            }
        }
    }
}
foreach ($namespace in @('Microsoft.App','Microsoft.OperationalInsights','Microsoft.ContainerRegistry',
    'Microsoft.DBforPostgreSQL','Microsoft.Storage','Microsoft.Compute','Microsoft.Network','Microsoft.Web')) {
    Invoke-AzJson @('provider','show','--namespace',$namespace,'--subscription',$sub,
        '--query','{namespace:namespace,registrationState:registrationState}') | Format-Table
}
Invoke-AzJson @('account','list-locations','--subscription',$sub,
    '--query','[].{name:name,displayName:displayName}') | Format-Table
Write-Warning 'list-locations is NOT an allowed-region list. Policy candidates are NOT a complete policy evaluator.'
Write-Host 'Portal: Policy > Assignments at subscription AND resource-group scopes; inspect inherited initiatives, definitions, exclusions and exemptions.'
Write-Host 'Then check service SKU/capacity and quotas separately. No visible restriction does not prove deployment authorization.'
