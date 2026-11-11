param(
    [Parameter(Position = 0)]
    [ValidateSet('up', 'verify', 'down', 'status')]
    [string]$Action = 'status'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Local = Join-Path $Root '.local'
$Reports = Join-Path $Local 'reports'
$IsVerification = $Action -eq 'verify'
$ProjectName = 'replicas'
$EnvironmentName = 'development.env'
if ($IsVerification) {
    $ProjectName = 'replicas-check'
    $EnvironmentName = 'verification.env'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is required. Install Docker Desktop and enable Linux containers.'
}
& docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker is not responding. Start the Docker engine and retry.'
}

New-Item -ItemType Directory -Path $Local -Force | Out-Null
$EnvironmentFile = Join-Path $Local $EnvironmentName
if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
    $Bytes = New-Object byte[] 32
    $Generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $Generator.GetBytes($Bytes)
    } finally {
        $Generator.Dispose()
    }
    $Credential = [System.BitConverter]::ToString($Bytes).Replace('-', '').ToLowerInvariant()
    [System.IO.File]::WriteAllText(
        $EnvironmentFile,
        "REPLICAS_DB_PASSWORD=$Credential`n",
        [System.Text.Encoding]::ASCII
    )
    $Credential = $null
    [Array]::Clear($Bytes, 0, $Bytes.Length)
}

$ComposeArgs = @(
    '--ansi', 'never',
    '--project-name', $ProjectName,
    '--env-file', $EnvironmentFile,
    '--file', (Join-Path $Root 'infra\docker\compose.yml')
)
if ($IsVerification) {
    $ComposeArgs += @('--profile', 'checks')
} else {
    $ComposeArgs += @('--file', (Join-Path $Root 'infra\docker\compose.local.yml'))
}
$env:COMPOSE_PARALLEL_LIMIT = '1'

function Invoke-Compose {
    param([Parameter(Mandatory = $true)][string[]]$DockerArguments)
    & docker compose @ComposeArgs @DockerArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose '$($DockerArguments[0])' failed with exit code $LASTEXITCODE."
    }
}

Invoke-Compose @('config', '--quiet')

switch ($Action) {
    'up' {
        Invoke-Compose @('up', '--detach', '--build', '--wait', '--wait-timeout', '180', 'db', 'api', 'web')
        Write-Host 'Replicas is ready at http://localhost:18110 (unless REPLICAS_WEB_PORT was overridden).'
    }
    'status' {
        Invoke-Compose @('ps')
    }
    'down' {
        Invoke-Compose @('down', '--remove-orphans')
    }
    'verify' {
        New-Item -ItemType Directory -Path (Join-Path $Reports 'java') -Force | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $Reports 'e2e') -Force | Out-Null
        $Passed = $false
        $CleanupExitCode = 0
        $Checks = New-Object 'System.Collections.Generic.List[string]'
        try {
            Invoke-Compose @('build', 'api', 'web', 'api-check', 'web-check', 'e2e')
            $Checks.Add('Production images compiled')
            Invoke-Compose @('run', '--rm', '--no-deps', 'web-check')
            $Checks.Add('Formatting, lint, TypeScript, frontend unit tests and production web build')
            Invoke-Compose @('up', '--detach', '--wait', '--wait-timeout', '120', 'db')
            Invoke-Compose @('run', '--rm', '--no-deps', 'api-check')
            $Checks.Add('Java formatting, compilation, unit and real PostgreSQL integration tests')
            Invoke-Compose @('up', '--detach', '--wait', '--wait-timeout', '180', 'db', 'api', 'web')
            $Before = (Invoke-Compose @(
                'exec', '-T', 'web', 'wget', '-qO-', 'http://api:8080/api/v1/system'
            ) | Out-String) | ConvertFrom-Json
            Invoke-Compose @(
                'run', '--rm', '--no-deps', '-e', 'TEST_MODE=healthy',
                '-e', 'PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/healthy', 'e2e'
            )
            $Checks.Add('Browser/API smoke, input boundaries and narrow-screen layout')
            Invoke-Compose @('stop', 'db')
            Invoke-Compose @(
                'run', '--rm', '--no-deps', '-e', 'TEST_MODE=outage',
                '-e', 'PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/outage', 'e2e'
            )
            $Checks.Add('Database outage: readiness fails, liveness stays up, UI reports failure')
            Invoke-Compose @('up', '--detach', '--wait', '--wait-timeout', '180', 'db', 'api', 'web')
            Invoke-Compose @('restart', 'db', 'api')
            Invoke-Compose @('up', '--detach', '--wait', '--wait-timeout', '180', 'db', 'api', 'web')
            $After = (Invoke-Compose @(
                'exec', '-T', 'web', 'wget', '-qO-', 'http://api:8080/api/v1/system'
            ) | Out-String) | ConvertFrom-Json
            if ($Before.installationId -ne $After.installationId -or $After.schemaVersion -ne 1) {
                throw 'Persistence check failed: installation identity or schema changed after restart.'
            }
            $Checks.Add('Installation metadata persists across database and API restart')
            Invoke-Compose @(
                'run', '--rm', '--no-deps', '-e', 'TEST_MODE=healthy',
                '-e', 'PLAYWRIGHT_OUTPUT_DIR=/workspace/test-results/recovered', 'e2e'
            )
            $Checks.Add('Browser/API smoke passes again after database recovery and restart')
            $Passed = $true
        } finally {
            & docker compose @ComposeArgs down --remove-orphans
            $CleanupExitCode = $LASTEXITCODE
            if ($CleanupExitCode -ne 0) {
                Write-Warning 'Verification-container cleanup failed; inspect the replicas-check project.'
            }
            @{
                timestampUtc = [DateTime]::UtcNow.ToString('o')
                passed = $Passed -and ($CleanupExitCode -eq 0)
                completedChecks = @($Checks.ToArray())
                hostedCiExecuted = ($env:GITHUB_ACTIONS -eq 'true')
            } | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $Reports 'verification.json') -Encoding UTF8
        }
        if ($CleanupExitCode -ne 0) {
            throw 'Checks passed, but verification containers could not be cleaned up.'
        }
        Write-Host "All Phase 1 checks passed. Reports: $Reports"
    }
}
