# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **Dashboard Filtering System**: Added a comprehensive filtering and sorting bar to the Rating History dashboard. Users can now filter ratings by Preset, Minimum Score, Date Range, and Critic Bias (Underrated vs Overrated).
- **Critic Bias UI**: Rating cards now dynamically display a color-coded delta (e.g. `+0.7` or `-1.2`) below your overall score, indicating exactly how much higher or lower your score is compared to the public IMDb average.
- **Analytics Overhaul**: The Insights Dashboard has been completely rebuilt with stunning data visualizations.
- **Taste Profile (Radar Chart)**: A new glowing radar chart that plots your average scores across different preset aspects.
- **Rating Timeline**: A timeline scatter plot that tracks every decimal rating over time.
- **Activity by Day**: A new bar chart analyzing what days of the week you rate movies.
- **Hall of Fame**: A visual grid showcasing your top 10 highest-rated movies with interactive posters.
- **Audience Alignment**: A metric that silently scrapes the public IMDb rating when you rate a movie, comparing it to your personal score to determine your critic tendency (e.g., "Generous Rater" or "Tough Critic").
- **Activity Heatmap Improvements**: Added `react-tooltip` for interactive hover data and fixed missing grid rendering on empty days.
- **IMDb CSV Importer**: Power users can now instantly migrate thousands of ratings from IMDb via the new "Import CSV" button in the Rating History dashboard.
- Users can now edit custom aspect names and optionally provide descriptions in the Options dashboard.
- Custom aspects now perfectly preserve the exact case formatting typed by the user, rather than overriding them with default labels.
- Users can now delete movie ratings from the Rating History dashboard, which automatically syncs the deletion to the cloud.
- **Dynamic Share Cards**: Exported Rating cards now perfectly adapt to custom presets with high numbers of aspects (e.g. 10+ aspects), utilizing smart multi-column layouts and auto-height wrapping.
- **Masonry Dashboard Layout**: Upgraded the Rating History grid to a Pinterest-style Bento/Masonry layout, ensuring cards with many aspects pack tightly without leaving awkward vertical gaps.
- **Insights Dashboard**: Added a brand new personal Analytics tab to the Options page. It features a stunning GitHub-style rating activity heatmap calendar and an interactive rating distribution bar chart powered by Recharts.
- **Global Theme Scrollbars**: All scrollbars across the extension have been redesigned to match the IMDb dark/yellow theme for a sleek, unified experience.

### Changed
- **Architecture Refactoring**: Completely overhauled the options dashboard architecture by componentizing layout components (`Sidebar`, `DashboardTab`, `PresetsTab`, `SocialTab`), ensuring strict separation of concerns and eliminating bloated codebase files.

### Fixed
- Fixed an issue where the weighted average score calculation in the modal was silently including hidden default aspects.

## [1.3.1] - 2026-06-23

### Fixed
- Fixed an issue where the Cloud Sync Mongoose backend schema was silently dropping `title` and `posterUrl` fields, causing movie posters and titles to disappear in the Dashboard after syncing.
- Fixed a `TypeError: Cannot read properties of undefined` crash in the Dashboard's search bar caused by attempting to search over legacy ratings that lacked a stored title.
- Hardened the IMDb title DOM scraping logic to gracefully extract movie titles even when the page structure dynamically changes.

## [1.3.0] - 2026-06-22

### Added
- Follow Friends: Search for other users by email and follow them.
- Social Integration: View your friends' ratings natively inside the IMDb modal.
- Added a "Friends" management dashboard to the Options page.

### Fixed
- Fixed a critical cloud sync issue where signing into a new device with an empty local database would overwrite and erase cloud ratings. Sync now intelligently merges local and cloud ratings based on timestamps.

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
