# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-06-22

### Added
- Follow Friends: Search for other users by email and follow them.
- Social Integration: View your friends' ratings natively inside the IMDb modal.
- Added a "Friends" management dashboard to the Options page.

## [1.2.0] - 2026-06-22

### Added
- **Cloud Sync**: Securely backup and sync all your ratings and presets across devices using Google Sign-In.
- Fixed Extension ID for consistent local unpacking and OAuth verification.
- Integrated a Serverless Backend via Vercel using MongoDB Atlas.

## [1.1.0] - 2026-06-22

### Added
- **Custom Rating Aspects**: Users can now fully customize the rating sliders within specific genre presets (e.g. adding "Cinematography", "Pacing").
- Dynamic rating modal that seamlessly renders the custom aspects defined in the active preset.
- Official website improvements, including Google Analytics integration and Ko-fi donation links.
- Privacy Policy update to clarify website usage tracking while confirming the extension remains telemetry-free.

## [1.0.1] - 2026-06-21

### Added
- "My Rating" title to the exportable share cards to explicitly clarify the rating context.
- Ambient, dynamically blurred movie poster background to exportable share cards for a stunning, glassmorphism visual effect.

## [1.0.0] - 2026-06-20
### Added
- Initial release.
- 5-Aspect contextual rating system (Enjoyment, Story, Characters, Technical Execution, Emotional Impact).
- Dynamic weighted scoring based on customizable genre presets.
- High-resolution, exportable share cards (Horizontal & Vertical layouts).
- Background auto-sync to native IMDb ratings.
- Integrated dashboard for rating history and custom preset management.
- Complete dark-mode IMDb matching aesthetic.
