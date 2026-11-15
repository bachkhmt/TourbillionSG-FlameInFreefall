[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
# Intentional non-executable gate: no real NASA importer/publication command exists on this baseline.
throw 'BLOCKED: main contains only the isolated synthetic seeder. Obtain the Data-owned importer, versioned artifact bundle and Backend acceptance before configuring any ingestion job. No database was changed.'
