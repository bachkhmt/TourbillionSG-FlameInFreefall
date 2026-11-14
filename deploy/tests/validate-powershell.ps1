# Parse ALL deployment PowerShell without executing Azure/resource changes.
$ErrorActionPreference = 'Stop'
$files = @(Get-ChildItem -LiteralPath "$PSScriptRoot/.." -Filter *.ps1 -Recurse -File)
foreach ($file in $files) {
    $tokens = $null
    $parseErrors = $null
    $null = [Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$parseErrors)
    if ($parseErrors.Count) { throw "Invalid PowerShell syntax: $($file.Name): $($parseErrors.Message -join '; ')" }
}
Write-Host "PASS: $($files.Count) PowerShell files parse successfully. No Azure commands executed."
