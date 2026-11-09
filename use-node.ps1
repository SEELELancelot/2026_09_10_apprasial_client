# Select the project's Node runtime for this PowerShell session only.
# Run again in each new terminal: .\use-node.ps1
& {
    $ErrorActionPreference = 'Stop'
    $nodeVersion = (Get-Content -LiteralPath (Join-Path $PSScriptRoot '.nvmrc') -Raw).Trim()
    if ($nodeVersion -notmatch '^22\.\d+\.\d+$') {
        throw 'Expected a pinned Node.js 22 version in .nvmrc.'
    }

    # Windows PowerShell 5.1 may not expose RuntimeInformation.OSArchitecture.
    # PROCESSOR_ARCHITEW6432 also handles a 32-bit shell on 64-bit Windows.
    $windowsArchitecture = $env:PROCESSOR_ARCHITEW6432
    if ([string]::IsNullOrWhiteSpace($windowsArchitecture)) {
        $windowsArchitecture = $env:PROCESSOR_ARCHITECTURE
    }
    switch ($windowsArchitecture) {
        'AMD64' { $architecture = 'x64' }
        'ARM64' { $architecture = 'arm64' }
        default { throw "Unsupported Windows architecture: $windowsArchitecture" }
    }

    $runtimeName = "node-v$nodeVersion-win-$architecture"
    $toolsDirectory = Join-Path $PSScriptRoot '.tools'
    $runtimeDirectory = Join-Path $toolsDirectory $runtimeName
    $nodeExecutable = Join-Path $runtimeDirectory 'node.exe'

    if (-not (Test-Path -LiteralPath $nodeExecutable)) {
        New-Item -ItemType Directory -Path $toolsDirectory -Force | Out-Null
        $archiveName = "$runtimeName.zip"
        $archivePath = Join-Path $toolsDirectory $archiveName
        $releaseUrl = "https://nodejs.org/dist/v$nodeVersion"
        Write-Host "Downloading official Node.js $nodeVersion ($architecture)..."
        Invoke-WebRequest -Uri "$releaseUrl/$archiveName" -OutFile $archivePath -UseBasicParsing
        $checksums = (Invoke-WebRequest -Uri "$releaseUrl/SHASUMS256.txt" -UseBasicParsing).Content
        $checksumLine = @($checksums -split '\r?\n' | Where-Object {
            $_ -match "^[a-fA-F0-9]{64}\s+$([regex]::Escape($archiveName))$"
        })
        if ($checksumLine.Count -ne 1) {
            throw "Could not find the official checksum for $archiveName."
        }
        $expectedHash = ($checksumLine[0] -split '\s+')[0]
        $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
        if ($actualHash -ne $expectedHash) {
            throw 'Node.js archive checksum verification failed.'
        }
        Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsDirectory -Force
    }

    $actualVersion = & $nodeExecutable --version
    if ($LASTEXITCODE -ne 0 -or $actualVersion -ne "v$nodeVersion") {
        throw "Expected Node.js v$nodeVersion, got $actualVersion."
    }
    $remainingPath = @($env:Path -split ';' | Where-Object { $_ -ne $runtimeDirectory })
    $env:Path = (@($runtimeDirectory) + $remainingPath) -join ';'
    Write-Host "Using Node.js $actualVersion for this terminal."
    Write-Host 'You can now run npm install, npm start, or npm run build.'
}
