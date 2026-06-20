# 🚀 Production & Release Strategy

Publishing a Chrome Extension to the Chrome Web Store requires a few specific steps to ensure your extension is approved quickly and functions securely for your users.

## 1. Final Pre-Flight Checks
Before creating a release build, ensure the following:
- **Build Completes:** Run `npm run build` and ensure the `/dist` directory is generated with no errors.
- **Console Logs Cleaned:** Remove any excessive or debugging `console.log` statements from `src/content/index.jsx` and `src/background/index.js` to ensure the production extension runs quietly.
- **Test the Build Locally:** Go to `chrome://extensions`, enable **Developer Mode**, and load the `/dist` folder. Navigate to IMDb and run through a full test (Rate a movie -> Verify UI -> Verify Export -> Verify Dashboard).

## 2. Prepare Extension Assets
The Chrome Web Store will automatically reject extensions that are missing required graphical assets.

### **Extension Icons (Required)**
You must include standard-sized icons inside your project and reference them in `manifest.json`.
1. Create a `public/icons` folder.
2. Generate your logo in three sizes: `icon16.png` (16x16), `icon48.png` (48x48), and `icon128.png` (128x128).
3. Add the following block to your `manifest.json`:
```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

### **Store Listing Assets (Required)**
When uploading to the developer dashboard, you will need:
- **Store Icon:** A high-res 128x128 PNG of your logo.
- **Screenshots:** At least 1 (up to 5) high-quality screenshots (1280x800 or 640x400) showing off the Rating Modal and the Dashboard.
- **Promo Marquee (Optional):** A 1400x560 banner to display at the top of your Web Store page.

## 3. Creating the Production Zip
Because we are using Vite, the actual code you submit to the Web Store is the bundled `/dist` folder, *not* your source code.

1. Ensure you have the latest version bumped in `manifest.json` and `package.json` (e.g., `"version": "1.0.0"`).
2. Run `npm run build`.
3. Locate the generated `/dist` folder.
4. **Zip the contents** of the `/dist` folder. *(Note: Zip the files inside the folder, not the folder itself. `manifest.json` should be at the root of your zip file).*
   - Example name: `fairrate-v1.0.0.zip`

## 4. Web Store Submission Process
1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Pay the one-time $5 developer registration fee (if you haven't already).
3. Click **New Item** and upload your `fairrate-v1.0.0.zip` file.
4. Fill out the store listing details:
   - **Description:** Clearly explain that this is a companion tool for IMDb. Mention features like custom weighting and exportable cards.
   - **Category:** "Productivity" or "Fun & Entertainment".
5. **Privacy Tab (Crucial):**
   - **Justification:** You must justify why you need the `storage` permission (To save user rating presets and history locally) and Host Permissions `*://*.imdb.com/*` (To read the movie title/poster and inject the rating interface).
   - **Data Handling:** Confirm you do not sell user data and that data is stored locally.
6. Submit for Review!

> [!NOTE]
> Initial reviews for extensions requesting host permissions (like IMDb access) usually take 1-3 business days. Once approved, it will be immediately available to the public.

## 5. Future Release Strategy
- Always bump the `"version"` field in `manifest.json` before releasing an update. The Web Store will reject the zip if the version number hasn't increased.
- Use `git tags` to mark your releases on GitHub (e.g., `git tag v1.0.1`).
- Since we implemented a strict Content Security Policy (`script-src 'self'`), you cannot dynamically load external JS scripts in future updates without updating the manifest. All logic must remain bundled by Vite.
