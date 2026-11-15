[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param([string]$ConfigPath = "$PSScriptRoot/config.local.ps1", [switch]$Push)
. "$PSScriptRoot/common.ps1"
$c = Read-DeployConfig $ConfigPath
Assert-DeploySelection $c
$image = "$($c.RegistryServer)/$($c.ImageRepository):$($c.ImageTag)"
$root = (Resolve-Path "$PSScriptRoot/../..").Path
if (-not $PSCmdlet.ShouldProcess($image, 'Build Linux image; push only with -Push')) { return }
& docker buildx build --platform linux/amd64 --load --file "$root/deploy/backend.Dockerfile" --tag $image $root
if ($LASTEXITCODE -ne 0) { throw 'Image build failed.' }
if ($Push) {
    if ($c.RegistryServer -like '*.azurecr.io') {
        $acr = $c.RegistryServer.Split('.')[0]
        $repositories = @(Invoke-AzJson @('acr','repository','list','--name',$acr,'--subscription',$c.SubscriptionId))
        if ($repositories -contains $c.ImageRepository) {
            $tags = @(Invoke-AzJson @('acr','repository','show-tags','--name',$acr,
                '--repository',$c.ImageRepository,'--subscription',$c.SubscriptionId))
            if ($tags -contains $c.ImageTag) { throw 'Release tag already exists; choose a new tag.' }
        }
    } else {
        throw 'For GHCR use manual docker push after checking the version tag is unused; this script only pushes to ACR.'
    }
    # Authenticate beforehand using az acr login; never accept a password parameter.
    & docker push $image
    if ($LASTEXITCODE -ne 0) { throw 'Push failed; no deployment attempted.' }
    Write-Host 'Record the pushed digest and lock this release tag in the registry.'
}
