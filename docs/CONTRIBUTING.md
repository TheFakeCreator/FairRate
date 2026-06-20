# 🤝 Contributing to FairRate

Thank you for your interest in improving FairRate! Whether you are fixing bugs, improving the IMDb scraping logic, or adding new dashboard features, your contributions are welcome.

## Development Environment Setup

1. **Prerequisites**
   - Node.js (v18 or higher recommended)
   - npm (v9 or higher)

2. **Clone & Install**
   ```bash
   git clone https://github.com/TheFakeCreator/FairRate
   cd fairrate-extension
   npm install
   ```

3. **Development Build**
   To actively develop the extension with hot-reloading:
   ```bash
   npm run dev
   ```
   *Note: Because Vite's HMR (Hot Module Replacement) behaves uniquely in Chrome Extension environments, some changes to the Content Script (`src/content/index.jsx`) may require you to manually reload the extension in `chrome://extensions` and hard refresh the IMDb page.*

4. **Testing the Dashboard**
   The Dashboard (`src/options`) and Popup (`src/popup`) can be developed much like standard React apps. You can load them directly via their HTML files in the browser once the extension is loaded unpacked.

## Project Structure

- `src/content/`: Contains the scripts injected directly into IMDb's DOM. This is where the modal injection and `MutationObserver` logic live.
- `src/options/`: The Dashboard React application where users view history and create presets.
- `src/popup/`: The small browser action popup for quick JSON import/exports.
- `src/lib/storage.js`: The central data layer utilizing `localforage` for reliable IndexedDB interactions.

## Coding Guidelines

- **Isolate CSS:** Because the content script injects CSS into IMDb, **never** add global CSS resets (`@tailwind base`, `*`, `body`) to `src/content/styles.css`. All styling for injected UI must be strictly scoped to avoid breaking the host website.
- **Robust Selectors:** IMDb frequently changes their HTML structure and classes. Whenever querying the DOM, provide multiple fallback selectors or use relational traversal rather than relying on a single hardcoded `data-testid`.
- **Use Error Boundaries:** Always ensure React trees injected into the host page are wrapped in `ErrorBoundary` components to prevent silent catastrophic failures.

## Submitting a Pull Request

1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature/amazing-new-idea`).
3. Commit your changes (`git commit -m 'Add amazing new idea'`).
4. Ensure the project builds successfully (`npm run build`).
5. Push to your branch (`git push origin feature/amazing-new-idea`).
6. Open a Pull Request! Please include a detailed description of what changed and any relevant screenshots.
