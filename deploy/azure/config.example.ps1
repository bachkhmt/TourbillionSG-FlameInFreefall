# Copy to config.local.ps1 (ignored). This file contains NO credentials.
$SubscriptionId = 'REPLACE_SUBSCRIPTION_UUID'
$ResourceGroup = 'rg-flameguard'
$Location = 'REPLACE_WITH_POLICY_ALLOWED_REGION'
# Enter regions only after inspecting effective Azure Policy and saving evidence locally.
$ApprovedLocations = @()
$ContainerApp = 'ca-flameguard-api'
$EnvironmentName = 'cae-flameguard'
$RegistryServer = 'REPLACE.azurecr.io' # Or public ghcr.io image, auth configured separately.
$ImageRepository = 'flameguard-api'
$ImageTag = 'v20261114-001' # Never latest; never overwrite an existing release tag.
$ManifestPath = '' # Existing admitted collection mounted at this path; empty => health-only.
$CorsOrigins = @('https://REPLACE.vercel.app')
$MinReplicas = 0 # Set 1 for judging only after reviewing cost.
$MigrationJob = 'job-flameguard-migrate'
