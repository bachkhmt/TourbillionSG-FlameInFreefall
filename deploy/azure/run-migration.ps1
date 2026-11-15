[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param([string]$ConfigPath = "$PSScriptRoot/config.local.ps1")
. "$PSScriptRoot/common.ps1"
$c = Read-DeployConfig $ConfigPath
Assert-DeploySelection $c
$job = Invoke-AzJson @('containerapp','job','show','--name',$c.MigrationJob,
    '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId)
$environment = Invoke-AzJson @('containerapp','env','show','--name',$c.EnvironmentName,
    '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId)
$container = @($job.properties.template.containers)
if ($job.properties.environmentId -ne $environment.id -or $container.Count -ne 1 -or
    $container[0].image -ne "$($c.RegistryServer)/$($c.ImageRepository):$($c.ImageTag)" -or
    $job.properties.configuration.triggerType -ne 'Manual' -or
    $job.properties.configuration.replicaRetryLimit -ne 0) {
    throw 'Migration job must be Manual, same environment/image, retry limit zero, one container.'
}
if (($container[0].command -join ' ') -ne 'python deployment/entrypoint.py' -or
    ($container[0].args -join ' ') -ne 'alembic upgrade head' -or
    $job.properties.configuration.manualTriggerConfig.parallelism -ne 1 -or
    $job.properties.configuration.manualTriggerConfig.replicaCompletionCount -ne 1) {
    throw 'Unexpected job command or concurrency; review in Portal.'
}
$db = @($container[0].env | Where-Object name -eq 'DATABASE_URL')
if ($db.Count -ne 1 -or -not $db[0].PSObject.Properties['secretRef'] -or
    -not $db[0].secretRef) { throw 'Migration database URL must use an owner secret reference.' }
$mode = @($container[0].env | Where-Object name -eq 'APP_ENV')
if ($mode.Count -ne 1 -or -not $mode[0].PSObject.Properties['value'] -or
    $mode[0].value -ne 'production') {
    throw 'Migration job APP_ENV must explicitly be production so deployment TLS guards remain enabled.'
}
$executions = @(Invoke-AzJson @('containerapp','job','execution','list','--name',$c.MigrationJob,
    '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId))
if (@($executions | Where-Object { $_.properties.status -in @('Running','Processing','Pending') }).Count) {
    throw 'An execution is active. Do not run overlapping migrations.'
}
if (-not $PSCmdlet.ShouldProcess($c.MigrationJob, 'Run alembic upgrade head on the operator-reviewed database')) { return }
$execution = Invoke-AzJson @('containerapp','job','start','--name',$c.MigrationJob,
    '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId)
Write-Host "Started $($execution.name). Verify execution Succeeded and Alembic current before API rollout. Do not rerun on uncertainty."
