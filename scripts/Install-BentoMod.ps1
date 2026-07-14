# Install-BentoMod.ps1
# Downloads the latest BentoMod Windows release from GitHub,
# extracts all contents into %LocalAppData%\BentoMod\,
# and creates a Start Menu shortcut so it's searchable.

# Enforce TLS 1.2 for older PowerShell compatibility
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ErrorActionPreference = "Stop"

# Config
$repo = "Kuusouu/BentoMod"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$installDir = Join-Path $env:LOCALAPPDATA "BentoMod"
$startMenuPath = [Environment]::GetFolderPath("Programs")
$shortcutPath = Join-Path $startMenuPath "BentoMod.lnk"
# Use a unique temp directory to prevent conflicts
$tempDir = Join-Path $env:TEMP "BentoMod-Install-$([guid]::NewGuid())"

Write-Host ""
Write-Host "=== BentoMod Installer ===" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "Checking for running instances..." -ForegroundColor Yellow
    $running = Get-Process -Name "BentoMod" -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "      Closing BentoMod..." -ForegroundColor DarkGray
        $running | Stop-Process -Force
        Start-Sleep -Seconds 2
    }

    Write-Host "Fetching latest release info..." -ForegroundColor Yellow
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ "User-Agent" = "PowerShell" }
    Write-Host "      Latest version: $($release.tag_name)" -ForegroundColor Green

    # Find the Windows zip asset (e.g. BentoMod-v1.4.3-Windows.zip)
    Write-Host "Locating Windows zip asset..." -ForegroundColor Yellow
    $asset = $release.assets | Where-Object { $_.name -like "*Windows*.zip" } | Select-Object -First 1

    if (-not $asset) {
        Write-Error "No Windows zip found in the latest release assets. Aborting."
        exit 1
    }
    Write-Host "      Found: $($asset.name)" -ForegroundColor Green

    # Download the zip to a temp folder
    Write-Host "Downloading $($asset.name)..." -ForegroundColor Yellow
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    $zipPath = Join-Path $tempDir $asset.name
    
    # Temporarily disable progress bar to massively speed up downloads in PowerShell 5.1
    $oldProgress = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing
    $ProgressPreference = $oldProgress
    
    Write-Host "      Download complete." -ForegroundColor Green

    # Extract the zip
    Write-Host "Extracting archive..." -ForegroundColor Yellow
    $extractDir = Join-Path $tempDir "extracted"
    Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

    # If the zip wraps everything in a single sub-folder, step into it
    $topLevel = Get-ChildItem -Path $extractDir
    $sourceDir = if ($topLevel.Count -eq 1 -and $topLevel[0].PSIsContainer) {
        $topLevel[0].FullName
    }
    else {
        $extractDir
    }

    Write-Host "      Extracted $(( Get-ChildItem $sourceDir -Recurse -File ).Count) files." -ForegroundColor Green

    # Copy everything to %LocalAppData%\BentoMod\
    Write-Host "Installing files and creating shortcut..." -ForegroundColor Yellow

    if (Test-Path $installDir) { Remove-Item $installDir -Recurse -Force }
    New-Item -ItemType Directory -Path $installDir | Out-Null
    Copy-Item -Path "$sourceDir\*" -Destination $installDir -Recurse -Force

    # Find the main .exe in the installed folder (targeting BentoMod*.exe)
    $exe = Get-ChildItem -Path $installDir -Filter "*BentoMod*.exe" -Recurse | Select-Object -First 1
    if (-not $exe) {
        # Fallback if no BentoMod*.exe is found, just find the first exe
        $exe = Get-ChildItem -Path $installDir -Filter "*.exe" -Recurse | Select-Object -First 1
    }
    
    if (-not $exe) {
        Write-Error "No .exe found after extraction. Aborting."
        exit 1
    }

    # Create a .lnk shortcut in Start Menu pointing at the exe
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $exe.FullName
    $shortcut.WorkingDirectory = $installDir
    $shortcut.Description = "BentoMod"
    $shortcut.Save()

    # Register uninstaller
    Write-Host "Registering uninstaller..." -ForegroundColor Yellow
    $registryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\BentoMod"
    if (-not (Test-Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
    }

    $uninstallCmd = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"& '$installDir\Uninstall-BentoMod.ps1'`""

    New-ItemProperty -Path $registryPath -Name "DisplayName" -Value "BentoMod" -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name "DisplayVersion" -Value $release.tag_name -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name "Publisher" -Value "Kuusouu" -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name "DisplayIcon" -Value $exe.FullName -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name "UninstallString" -Value $uninstallCmd -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name "NoModify" -Value 1 -PropertyType DWord -Force | Out-Null
    New-ItemProperty -Path $registryPath -Name "NoRepair" -Value 1 -PropertyType DWord -Force | Out-Null

    Write-Host ""
    Write-Host "Done! BentoMod $($release.tag_name) is installed." -ForegroundColor Green
    Write-Host "Files    : $installDir" -ForegroundColor White
    Write-Host "Shortcut : $shortcutPath" -ForegroundColor White
    Write-Host "Tip      : Press Win and type 'BentoMod' to launch it." -ForegroundColor DarkGray
    Write-Host ""

} finally {
    # Ensure cleanup always happens, even if the script crashes
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
}