[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$BaseUrl,
    [switch]$RequireCatalog,
    [switch]$AllowLocalHttp
)
$ErrorActionPreference = 'Stop'
$uri = [Uri]$BaseUrl
if ($uri.Scheme -ne 'https' -and -not ($AllowLocalHttp -and
    $uri.Scheme -eq 'http' -and $uri.IsLoopback)) { throw 'Use HTTPS, or explicit loopback HTTP.' }
if ($uri.UserInfo -or $uri.Query -or $uri.Fragment) { throw 'Do not put credentials or query strings in BaseUrl.' }
$origin = $BaseUrl.TrimEnd('/')
foreach ($path in @('/api/v1/health','/api/v1/ready','/openapi.json')) {
    $null = Invoke-RestMethod -Uri "$origin$path" -TimeoutSec 30
    Write-Host "PASS $path"
}
if ($RequireCatalog) {
    $page = Invoke-RestMethod -Uri "$origin/api/v1/investigations?limit=2" -TimeoutSec 30
    if (-not $page.PSObject.Properties['context']) { throw 'Missing collection context.' }
    Write-Host "PASS catalog; total=$($page.total), origin=$($page.context.origin). This is not scientific validation."
}
