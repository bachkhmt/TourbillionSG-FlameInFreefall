[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param([string]$ConfigPath = "$PSScriptRoot/config.local.ps1", [switch]$AllowHealthOnly)
. "$PSScriptRoot/common.ps1"
$c = Read-DeployConfig $ConfigPath
Assert-DeploySelection $c
if (-not $c.ManifestPath -and -not $AllowHealthOnly) {
    throw 'No admitted collection configured. Supply ManifestPath or explicitly select -AllowHealthOnly.'
}
$app = Invoke-AzJson @('containerapp','show','--name',$c.ContainerApp,
    '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId)
$environment = Invoke-AzJson @('containerapp','env','show','--name',$c.EnvironmentName,
    '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId)
if ($environment.location -ne $c.Location -or $app.location -ne $c.Location -or
    $app.properties.managedEnvironmentId -ne $environment.id) {
    throw 'Existing app/environment location or environment binding differs; review manually.'
}
if (@($app.properties.template.containers).Count -ne 1) {
    throw 'Expected one backend container; refusing to overwrite a multi-container deployment.'
}
$container = $app.properties.template.containers[0]
foreach ($item in @($(if ($container.PSObject.Properties['env']) { $container.env }))) {
    if ($item.name -match 'KEY|TOKEN|PASSWORD|SECRET|DATABASE_URL' -and
        $item.PSObject.Properties['value'] -and $item.value) {
        throw 'Move sensitive plaintext environment variables to Container App secrets first.'
    }
}
if (@($app.properties.configuration.secrets | Where-Object name -eq 'database-url').Count -ne 1) {
    throw 'Configure the reader DATABASE_URL as secret database-url in Portal first (ssl=verify-full).'
}
$container.image = "$($c.RegistryServer)/$($c.ImageRepository):$($c.ImageTag)"
# Remove quickstart command overrides so the image entrypoint is actually used.
$container.PSObject.Properties.Remove('command')
$container.PSObject.Properties.Remove('args')
$container | Add-Member -Force NoteProperty resources @{cpu=0.5; memory='1Gi'}
$container | Add-Member -Force NoteProperty env @(
    @{name='APP_ENV'; value='production'}, @{name='DEBUG'; value='false'},
    @{name='DATABASE_URL'; secretRef='database-url'},
    @{name='CORS_ORIGINS'; value=(ConvertTo-Json -InputObject @($c.CorsOrigins) -Compress)},
    @{name='CHAT_PROVIDER'; value='unavailable'}, @{name='PREDICTION_PROVIDER'; value='unavailable'}
)
if ($c.ManifestPath) {
    if (-not $container.PSObject.Properties['volumeMounts'] -or -not @($container.volumeMounts).Count) {
        throw 'Configure the admitted collection volume mount first.'
    }
    $container.env += @{name='CATALOG_COLLECTION_MANIFEST'; value=$c.ManifestPath}
}
$container | Add-Member -Force NoteProperty probes @(
    @{type='Startup'; httpGet=@{path='/api/v1/health';port=8000};periodSeconds=5;timeoutSeconds=3;failureThreshold=48},
    @{type='Liveness'; httpGet=@{path='/api/v1/health';port=8000};periodSeconds=30;timeoutSeconds=3;failureThreshold=3},
    @{type='Readiness'; httpGet=@{path='/api/v1/ready';port=8000};periodSeconds=10;timeoutSeconds=5;failureThreshold=3}
)
$app.properties.template | Add-Member -Force NoteProperty scale @{minReplicas=$c.MinReplicas;maxReplicas=1}
$app.properties.template | Add-Member -Force NoteProperty revisionSuffix ('r' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))
$body = @{
    location=$c.Location
    properties=@{
        managedEnvironmentId=$environment.id
        configuration=@{
            activeRevisionsMode='Single'
            ingress=@{external=$true;targetPort=8000;transport='auto';allowInsecure=$false}
        }
        template=$app.properties.template
    }
}
if (-not $PSCmdlet.ShouldProcess($c.ContainerApp, 'Update existing app revision, HTTPS ingress and scale')) { return }
$temporary = Join-Path ([IO.Path]::GetTempPath()) ([IO.Path]::GetRandomFileName() + '.json')
try {
    # JSON is valid YAML. Only secret references are serialized; no secret values.
    [IO.File]::WriteAllText($temporary, (ConvertTo-Json -InputObject $body -Depth 40))
    $null = Invoke-AzJson @('containerapp','update','--name',$c.ContainerApp,
        '--resource-group',$c.ResourceGroup,'--subscription',$c.SubscriptionId,'--yaml',$temporary)
} finally {
    Remove-Item -LiteralPath $temporary -ErrorAction SilentlyContinue
}
Write-Host 'Revision submitted. Run smoke-test; readiness here checks DB connectivity, not scientific publication.'
