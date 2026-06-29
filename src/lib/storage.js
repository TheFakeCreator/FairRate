import localforage from "localforage";

// Check if we are in the extension background/popup or a content script
// Background worker has no window. Popup has chrome-extension: protocol. Content scripts have https: protocol.
const isExtensionContext =
  typeof window === "undefined" ||
  window.location.protocol === "chrome-extension:";

const API_URL = import.meta.env.PROD
  ? "https://fairrate-pi.vercel.app/api"
  : "http://localhost:3000/api";

let ratingsStore = null;
let settingsStore = null;
if (isExtensionContext) {
  ratingsStore = localforage.createInstance({
    name: "FairRate",
    storeName: "movie_ratings",
  });
  settingsStore = localforage.createInstance({
    name: "FairRate",
    storeName: "settings",
  });
}

/**
 * Save a rating for a specific movie ID
 */
export async function saveRating(movieId, ratingData) {
  if (!isExtensionContext) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { action: "saveRating", movieId, ratingData },
          (response) => {
            if (chrome.runtime.lastError)
              console.warn(chrome.runtime.lastError);
            resolve(response);
          },
        );
      } catch (e) {
        console.warn("FairRate: sendMessage error", e);
        resolve(false);
      }
    });
  }

  try {
    const existing = (await getRating(movieId)) || {};
    await ratingsStore.setItem(movieId, {
      ...existing,
      ...ratingData,
      updatedAt: new Date().toISOString(),
    });

    // Auto-sync to cloud if logged in
    pushToCloud().catch(console.error);

    return true;
  } catch (err) {
    console.error("Failed to save rating:", err);
    return false;
  }
}
/**
 * Silently update a poster without changing the updatedAt timestamp
 */
export async function updatePosterUrl(movieId, posterUrl) {
  if (!isExtensionContext) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "updatePoster", movieId, posterUrl },
        resolve,
      );
    });
  }

  try {
    const existing = await getRating(movieId);
    if (existing) {
      existing.posterUrl = posterUrl;
      await ratingsStore.setItem(movieId, existing);
      // Do not sync to cloud here to save quota for a simple image update, or we can.
      // Let's not trigger a full cloud sync just for a lazy loaded poster.
    }
    return true;
  } catch (err) {
    console.error("Failed to update poster:", err);
    return false;
  }
}

/**
 * Get a rating for a specific movie ID
 */
export async function getRating(movieId) {
  if (!isExtensionContext) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { action: "getRating", movieId },
          (response) => {
            if (chrome.runtime.lastError)
              console.warn(chrome.runtime.lastError);
            resolve(response);
          },
        );
      } catch (e) {
        console.warn("FairRate: sendMessage error", e);
        resolve(null);
      }
    });
  }

  try {
    return await ratingsStore.getItem(movieId);
  } catch (err) {
    console.error("Failed to get rating:", err);
    return null;
  }
}

/**
 * Delete a rating for a specific movie ID
 */
export async function deleteRating(movieId) {
  if (!isExtensionContext) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { action: "deleteRating", movieId },
          (response) => {
            if (chrome.runtime.lastError)
              console.warn(chrome.runtime.lastError);
            resolve(response);
          },
        );
      } catch (e) {
        console.warn("FairRate: sendMessage error", e);
        resolve(false);
      }
    });
  }

  try {
    await ratingsStore.removeItem(movieId);

    // Auto-sync to cloud if logged in
    pushToCloud().catch(console.error);

    return true;
  } catch (err) {
    console.error("Failed to delete rating:", err);
    return false;
  }
}

/**
 * Get all saved ratings
 */
export async function getAllRatings() {
  if (!isExtensionContext) return [];
  try {
    const ratings = [];
    await ratingsStore.iterate((value, key) => {
      ratings.push({ movieId: key, ...value });
    });
    // Sort by most recently updated
    return ratings.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
  } catch (err) {
    console.error("Failed to get all ratings:", err);
    return [];
  }
}

/**
 * Batch import IMDb CSV ratings
 */
export async function batchImportIMDbRatings(csvRatings, onProgress = null) {
  if (!isExtensionContext) return -1;
  try {
    const presets = await getPresets();
    const targetPreset = presets[0] || DEFAULT_PRESETS[0];
    const aspects = Object.keys(targetPreset.weights);

    let imported = 0;

    for (let i = 0; i < csvRatings.length; i++) {
      const { movieId, overall, title } = csvRatings[i];
      const existing = await ratingsStore.getItem(movieId);
      if (existing) continue; // Skip existing

      const scores = {};
      for (const aspect of aspects) {
        scores[aspect] = overall;
      }

      await ratingsStore.setItem(movieId, {
        title,
        overall,
        scores,
        presetId: targetPreset.id,
        updatedAt: new Date().toISOString(),
      });

      imported++;

      if (onProgress && i % 50 === 0) {
        onProgress(Math.floor((i / csvRatings.length) * 100), imported);
      }
    }

    if (onProgress) {
      onProgress(100, imported);
    }

    if (imported > 0) {
      pushToCloud().catch(console.error);
    }

    return imported;
  } catch (err) {
    console.error("Batch import failed:", err);
    return -1;
  }
}

/**
 * Clear all ratings and import new ones
 */
export async function importRatings(jsonData) {
  if (!isExtensionContext) return false;
  try {
    const data = JSON.parse(jsonData);
    await ratingsStore.clear();
    for (const [key, value] of Object.entries(data)) {
      await ratingsStore.setItem(key, value);
    }
    return true;
  } catch (err) {
    console.error("Failed to import ratings:", err);
    return false;
  }
}

/**
 * Export all ratings as JSON string
 */
export async function exportRatings() {
  if (!isExtensionContext) return "{}";
  try {
    const exportData = {};
    await ratingsStore.iterate((value, key) => {
      exportData[key] = value;
    });
    return JSON.stringify(exportData, null, 2);
  } catch (err) {
    console.error("Failed to export ratings:", err);
    return "{}";
  }
}

export const DEFAULT_PRESETS = [
  {
    id: "default-balanced",
    name: "Balanced (Default)",
    weights: {
      story: 1,
      enjoyment: 1,
      characters: 1,
      technical: 1,
      emotional: 1,
    },
  },
  {
    id: "default-action",
    name: "Action / Spectacle",
    weights: {
      story: 0.8,
      enjoyment: 1.2,
      characters: 0.8,
      technical: 1.5,
      emotional: 0.7,
    },
  },
  {
    id: "default-drama",
    name: "Character Drama",
    weights: {
      story: 1.2,
      enjoyment: 0.8,
      characters: 1.5,
      technical: 0.8,
      emotional: 1.5,
    },
  },
  {
    id: "default-anime",
    name: "Anime / Animated",
    weights: {
      worldbuilding: 1.5,
      story: 2.0,
      visuals: 1.5,
      sound: 1.1,
      characters: 1.5,
      enjoyment: 1.8,
      hook: 1.5,
      pacing: 1.5,
    },
    aspectMeta: {
      worldbuilding: { label: "Worldbuilding", desc: "" },
      story: { label: "Story & Plot", desc: "" },
      visuals: { label: "Visuals / Animation", desc: "" },
      sound: { label: "Sound & Music", desc: "" },
      characters: { label: "Character Development", desc: "" },
      enjoyment: { label: "Enjoyment", desc: "" },
      hook: { label: "Hook", desc: "" },
      pacing: { label: "Pacing", desc: "" },
    },
  },
  {
    id: "default-horror",
    name: "Horror / Thriller",
    weights: {
      atmosphere: 2.0,
      pacing: 1.5,
      plot: 1.0,
      characters: 1.0,
      scares: 1.5,
    },
    aspectMeta: {
      atmosphere: { label: "Atmosphere & Tension", desc: "" },
      pacing: { label: "Pacing", desc: "" },
      plot: { label: "Plot", desc: "" },
      characters: { label: "Characters & Acting", desc: "" },
      scares: { label: "Scares / Impact", desc: "" },
    },
  },
  {
    id: "default-comedy",
    name: "Comedy",
    weights: { humor: 2.5, pacing: 1.5, characters: 1.5, plot: 0.5 },
    aspectMeta: {
      humor: { label: "Humor / Laughs", desc: "" },
      pacing: { label: "Pacing", desc: "" },
      characters: { label: "Characters & Chemistry", desc: "" },
      plot: { label: "Plot", desc: "" },
    },
  },
  {
    id: "default-scifi",
    name: "Sci-Fi / Fantasy",
    weights: {
      worldbuilding: 2.0,
      vfx: 1.5,
      plot: 1.5,
      characters: 1.0,
      enjoyment: 1.0,
    },
    aspectMeta: {
      worldbuilding: { label: "Worldbuilding", desc: "" },
      vfx: { label: "VFX / Practical Effects", desc: "" },
      plot: { label: "Plot & Originality", desc: "" },
      characters: { label: "Characters", desc: "" },
      enjoyment: { label: "Enjoyment", desc: "" },
    },
  },
];

export async function getPresets() {
  if (!isExtensionContext) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: "getPresets" }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError);
          resolve(response || DEFAULT_PRESETS);
        });
      } catch (e) {
        console.warn("FairRate: sendMessage error", e);
        resolve(DEFAULT_PRESETS);
      }
    });
  }
  try {
    let presets = await settingsStore.getItem("presets");
    if (!presets) return DEFAULT_PRESETS;

    // Migration: Inject any missing default presets (by ID)
    let missingDefaults = DEFAULT_PRESETS.filter(
      (dp) => !presets.find((p) => p.id === dp.id),
    );
    if (missingDefaults.length > 0) {
      presets = [...presets, ...missingDefaults];
      await settingsStore.setItem("presets", presets);
      pushToCloud().catch((e) => console.warn("Failed auto-sync defaults", e));
    }

    return presets;
  } catch (err) {
    console.error("Failed to get presets:", err);
    return DEFAULT_PRESETS;
  }
}

export async function savePresets(presetsArray) {
  if (!isExtensionContext) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          { action: "savePresets", presets: presetsArray },
          (response) => {
            if (chrome.runtime.lastError)
              console.warn(chrome.runtime.lastError);
            resolve(response);
          },
        );
      } catch (e) {
        console.warn("FairRate: sendMessage error", e);
        resolve(false);
      }
    });
  }
  try {
    await settingsStore.setItem("presets", presetsArray);

    // Auto-sync to cloud if logged in
    pushToCloud().catch(console.error);

    return true;
  } catch (err) {
    console.error("Failed to save presets:", err);
    return false;
  }
}

// --- CLOUD SYNC LOGIC ---

export async function pushToCloud() {
  if (!isExtensionContext) return false;
  const result = await chrome.storage.local.get(["authToken"]);
  if (!result.authToken) return false;

  try {
    const ratings = await getAllRatings();
    const presets = await getPresets();

    const response = await fetch(`${API_URL}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${result.authToken}`,
      },
      body: JSON.stringify({ presets, ratings }),
    });
    return response.ok;
  } catch (e) {
    console.error("Cloud push failed", e);
    return false;
  }
}

export async function pullFromCloud() {
  if (!isExtensionContext) return false;
  const result = await chrome.storage.local.get(["authToken"]);
  if (!result.authToken) return false;

  try {
    const response = await fetch(`${API_URL}/sync`, {
      method: "GET",
      headers: { Authorization: `Bearer ${result.authToken}` },
    });

    if (!response.ok) return false;
    const data = await response.json();

    // Merge down to local storage
    if (data.presets && data.presets.length > 0) {
      // If cloud has presets, we will use them to override local
      await settingsStore.setItem("presets", data.presets);
    }

    if (data.ratings && data.ratings.length > 0) {
      // Do a proper merge based on updatedAt to prevent data loss
      for (const r of data.ratings) {
        const { movieId, ...rest } = r;
        const local = await ratingsStore.getItem(movieId);

        // If local doesn't have it, or cloud is newer, overwrite local
        if (!local || new Date(rest.updatedAt) > new Date(local.updatedAt)) {
          await ratingsStore.setItem(movieId, rest);
        }
      }
    }

    return true;
  } catch (e) {
    console.error("Cloud pull failed", e);
    return false;
  }
}

// --- SOCIAL / FRIENDS LOGIC ---

export async function searchUser(email) {
  const result = await chrome.storage.local.get(["authToken"]);
  if (!result.authToken) return null;

  try {
    const response = await fetch(
      `${API_URL}/friends?action=search&email=${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${result.authToken}` },
      },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

export async function getFollowing() {
  const result = await chrome.storage.local.get(["authToken"]);
  if (!result.authToken) return [];

  try {
    const response = await fetch(`${API_URL}/friends?action=list`, {
      headers: { Authorization: `Bearer ${result.authToken}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.following || [];
  } catch (e) {
    return [];
  }
}

export async function toggleFollow(targetUserId) {
  const result = await chrome.storage.local.get(["authToken"]);
  if (!result.authToken) return false;

  try {
    const response = await fetch(`${API_URL}/friends`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${result.authToken}`,
      },
      body: JSON.stringify({ action: "follow", targetUserId }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data;
  } catch (e) {
    return false;
  }
}

export async function getFriendsRatings(movieId) {
  const result = await chrome.storage.local.get(["authToken"]);
  if (!result.authToken) return [];

  try {
    const response = await fetch(
      `${API_URL}/friends?action=ratings&movieId=${movieId}`,
      {
        headers: { Authorization: `Bearer ${result.authToken}` },
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.ratings || [];
  } catch (e) {
    return [];
  }
}
