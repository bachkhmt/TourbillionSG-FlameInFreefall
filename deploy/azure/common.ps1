Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-AzJson {
    param([string[]]$Arguments)
    # No secrets accepted by these helpers. Do not enable CLI --debug or transcripts.
    $result = & az @Arguments --only-show-errors --output json
    if ($LASTEXITCODE -ne 0) { throw 'Azure CLI command failed; execution stopped.' }
    if ($result) { return (($result -join "`n") | ConvertFrom-Json) }
}

function Read-DeployConfig {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw 'Copy config.example.ps1 to config.local.ps1 first.' }
    . $Path
    $config = @{
        SubscriptionId=$SubscriptionId; ResourceGroup=$ResourceGroup; Location=$Location
        ApprovedLocations=@($ApprovedLocations); ContainerApp=$ContainerApp
        EnvironmentName=$EnvironmentName; RegistryServer=$RegistryServer
        ImageRepository=$ImageRepository; ImageTag=$ImageTag; ManifestPath=$ManifestPath
        CorsOrigins=@($CorsOrigins); MinReplicas=$MinReplicas; MigrationJob=$MigrationJob
    }
    if ($config.SubscriptionId -notmatch '^[0-9a-fA-F-]{36}$') { throw 'Set the subscription UUID.' }
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw 'Install Azure CLI, then az login.' }
    $account = Invoke-AzJson @('account','show','--subscription',$config.SubscriptionId)
    if ($account.id -ne $config.SubscriptionId -or $account.state -ne 'Enabled') {
        throw 'Subscription unavailable or not Enabled.'
    }
    return $config
}

function Assert-DeploySelection {
    param($Config)
    if ($Config.ApprovedLocations -notcontains $Config.Location) {
        throw 'Inspect effective Azure Policy first; add the verified region to ApprovedLocations.'
    }
    if ($Config.ImageTag -notmatch '^v[0-9]{8}-[a-zA-Z0-9][a-zA-Z0-9.-]*$') {
        throw 'Use a unique version tag such as v20261114-001; latest is forbidden.'
    }
    if ($Config.MinReplicas -notin @(0,1)) { throw 'Only min replicas 0 or 1 is supported.' }
}
