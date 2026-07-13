# Uninstall-BentoMod.ps1 (credits to mewclouds)
param (
    [switch]$Cleanup
)

$ErrorActionPreference = "SilentlyContinue"

if (-not $Cleanup) {
    # Phase 1: We are running from the installation folder.
    
    # 1. Close the app
    Stop-Process -Name "BentoMod", "BentoMod.exe" -Force
    
    # 2. Delete the Start Menu shortcut
    $shortcutPath = Join-Path ([Environment]::GetFolderPath("Programs")) "BentoMod.lnk"
    Remove-Item -Path $shortcutPath -Force
    
    # 3. Delete the Registry Keys
    Remove-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\BentoMod' -Force -Recurse
    Remove-Item -Path 'HKCU:\Software\Classes\bentomod' -Force -Recurse

    # 4. Copy this script to TEMP and run it to delete the installation folder
    $tempScript = Join-Path $env:TEMP "Uninstall-BentoMod-Temp.ps1"
    Copy-Item -Path $PSCommandPath -Destination $tempScript -Force
    
    # Launch the temp script
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$tempScript`" -Cleanup" -WindowStyle Hidden
    
    # Exit this script so the folder is no longer locked
    exit
}
else {
    # Phase 2: We are running from TEMP.
    
    # Wait a moment for the original script to exit and release locks
    Start-Sleep -Seconds 2
    
    # Delete the folders safely by hardcoding the paths
    $installDir = Join-Path $env:LOCALAPPDATA "BentoMod"
    $configDir = Join-Path $env:APPDATA "BentoMod"
    $tauriDir = Join-Path $env:LOCALAPPDATA "com.internal.bentomod"
    
    Remove-Item -Path $installDir -Recurse -Force
    Remove-Item -Path $configDir -Recurse -Force
    Remove-Item -Path $tauriDir -Recurse -Force
    
    # Delete Temp Files and Folders
    $tempLogsAndFolders = @(
        "bentomod_update",
        "bentomod_updater.bat",
        "bentomod.log",
        "bentomod"
    )
    foreach ($item in $tempLogsAndFolders) {
        $tempPath = Join-Path $env:TEMP $item
        if (Test-Path $tempPath) {
            Remove-Item -Path $tempPath -Recurse -Force
        }
    }
    
    # Show success message
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show('BentoMod has been successfully uninstalled.', 'BentoMod Uninstaller', 'OK', 'Information')
    
    # Delete this temp script
    Remove-Item -Path $PSCommandPath -Force
}
