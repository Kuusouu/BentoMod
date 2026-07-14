# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-07-14

### Removed
- Removed the legacy ReCompress tool from both the backend commands and the Tools Panel UI, as recompression is now handled dynamically.

## [1.2.0] - 2026-07-14

### Changed
- Removed all platform-specific code, dependencies, and conditionals for Linux and macOS, making BentoMod fully optimized as a Windows-only application.
- Cleaned up project infrastructure, removing the legacy website, unused scripts, and obsolete CI workflows.

### Fixed
- Fixed self-update mechanism to correctly sync and update `DisplayVersion` in the Windows Registry.
- Removed legacy "RepakX" process termination in the `Install-BentoMod.ps1` script.

## [1.1.2] - 2026-07-13

### Added
- Added quick filters in the left sidebar to filter mods by status (All, Enabled, Disabled).

## [1.1.1] - 2026-07-13

### Fixed
- Fixed "Move to..." actions from the mod context menu and multi-select toolbar to display full folder path hierarchies instead of single folder names.
- Completely removed the hidden April Fools prank logic (Comic Sans font forcing, layout flashes, and mouse-dodging drop targets).

## [1.1.0] - 2026-07-13

### Added
- Added full support for setting custom HEX accent colors via the settings menu. The entire app, including the Aurora background glow, will dynamically theme itself to your color.

### Changed
- Clarified the "Parallel Boost Mode" toggle into "Processing Speed" for better transparency.

### Removed
- Completely removed all traces of the Discord Rich Presence integration to improve privacy and reduce bloat.
- Removed the "Rat Mode" Easter egg joke when switching to Light Mode.

## [1.0.0] - 2026-07-13

### Added
- Welcome to **BentoMod v1.0.0**!
- Complete rebrand to a lightweight, premium Mod Manager.
- Fully isolated infrastructure and independent auto-updater.
- Removed legacy bloatware (Discord Widget, P2P Mod Sharing).
- Fixed upstream sources for the Hero ID database and VFX Updater mappings.
