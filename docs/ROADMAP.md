# FairRate - Future Release Roadmap

This document outlines the planned features and major updates for upcoming releases of FairRate, moving beyond the v1.0.x MVP.

---

## ☁️ Phase 5: Cloud Sync (Next Major Goal)

Currently, all ratings and presets are stored locally in the browser's IndexedDB. The next major architectural shift is implementing optional Cloud Sync.

* **User Accounts:** Allow users to optionally sign up/log in to back up their data securely to the cloud.
* **Cross-Device Synchronization:** Seamlessly sync rating history and custom genre presets across multiple computers and browsers.
* **Data Portability:** Ensure users can still easily export their data even if they are using Cloud Sync.

---

## 🚀 Upcoming Features

Once Cloud Sync is established, it opens the door to the following high-priority features:

### 1. Letterboxd Integration (Cross-Platform)
Expand FairRate's injection capabilities beyond just IMDb.
* Inject the FairRate rating modal directly into **Letterboxd** movie pages.
* Provide an option to sync the calculated FairRate score to both IMDb and Letterboxd simultaneously, eliminating double-entry for hardcore movie buffs.

### 2. Follow Friends (Social Integration)
Transform the solitary rating experience into a social one.
* Utilize the Cloud Sync user account system to allow users to "Follow" their friends.
* **IMDb Page Widgets:** When viewing a movie on IMDb, see a small widget displaying how your friends rated the 5 distinct aspects of the film compared to your own scores (e.g., *"Your friend John gave this a 9/10 for Story, but a 4/10 for Enjoyment"*).

### 3. TV Show Specific Metrics
Improve the rating context when evaluating television series instead of feature-length films.
* Detect when a user is on a TV Show or TV Episode page on IMDb.
* Swap the default movie sliders out for television-specific metrics such as *"Character Development"*, *"Season Arc"*, *"Consistency"*, and *"Ending/Resolution"*.

### 4. Third-Party API Integrations
Explore incorporating additional data sources to enrich the rating context.
* **MovieDive & ShowDive:** Investigate integrating the API of [moviedive.org](https://moviedive.org) and [showdive.com](https://showdive.com) to pull in extra metadata and deeper analysis for movies and TV shows.
