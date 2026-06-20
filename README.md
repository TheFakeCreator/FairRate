<div align="center">
  <img src="public/icons/icon128.png" width="100" alt="FairRate Logo" />
  <h1>FairRate - Context-Aware IMDb Ratings</h1>
  <p>A powerful Chrome extension that completely transforms how you rate movies on IMDb by breaking down ratings into 5 distinct cinematic aspects.</p>
</div>

## 🌟 Overview

Tired of giving a movie a flat "7/10" and forgetting why? **FairRate** replaces IMDb's default 1-10 star clicker with a beautiful, context-aware rating modal. It forces you to think critically about what you just watched by evaluating movies across 5 weighted categories.

FairRate completely syncs with your native IMDb account in the background—so you still get the official IMDb rating credit, but with a much richer personal database!

## Screenshots

![Movie Page](/public/images/heropage.png)
![Rating Modal](/public/images/ratingmodal.png)
![Export Card](/public/images/exportcard.png)
![Popup Menu](/public/images/popup.png)
![Dashboard](/public/images/dashboard.png)
![Custom Presets](/public/images/custompresets.png)

## ✨ Features

- **🎬 5-Aspect Rating System:** Rate movies based on *Enjoyment*, *Story*, *Characters*, *Technical Execution*, and *Emotional Impact*.
- **⚖️ Custom Weighting:** Are you an action junkie? Create custom genre presets in your dashboard that assign higher multipliers to *Technical* or *Enjoyment* scores!
- **📸 Beautiful Exportable Cards:** Share your in-depth ratings on Twitter, Reddit, or Letterboxd with stunning, auto-generated rating cards featuring the official movie poster.
- **🔄 Auto-Syncs with IMDb:** No double-work. Whatever your final weighted score is, FairRate automatically pushes that rating directly into IMDb's native system.
- **📊 Local Dashboard:** View, search, and manage your entire rating history right inside the extension. Includes JSON import/export to keep your data safe.

## 🚀 Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/TheFakeCreator/FairRate
   ```
2. Navigate into the directory and install dependencies:
   ```bash
   cd fairrate-extension
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load into Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode** in the top right.
   - Click **Load unpacked** and select the generated `/dist` folder.

## 🛠️ Tech Stack

- **React 18** (UI Components & State Management)
- **Vite** (Ultra-fast build tool)
- **Tailwind CSS** (Utility-first styling)
- **LocalForage** (IndexedDB persistent storage)
- **html-to-image** (Canvas rendering for exportable cards)

## 🤝 Contributing

We welcome contributions! Please see the `docs/CONTRIBUTING.md` file for details on how to set up the development environment and submit Pull Requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
