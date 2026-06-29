import localforage from 'localforage'

// Check if we are in the extension background/popup or a content script
// Background worker has no window. Popup has chrome-extension: protocol. Content scripts have https: protocol.
const isExtensionContext = typeof window === 'undefined' || window.location.protocol === 'chrome-extension:'

const API_URL = import.meta.env.PROD 
  ? 'https://fairrate-pi.vercel.app/api' 
  : 'http://localhost:3000/api';

let ratingsStore = null
let settingsStore = null
if (isExtensionContext) {
  ratingsStore = localforage.createInstance({
    name: "FairRate",
    storeName: "movie_ratings"
  })
  settingsStore = localforage.createInstance({
    name: "FairRate",
    storeName: "settings"
  })
}

/**
 * Save a rating for a specific movie ID
 */
export async function saveRating(movieId, ratingData) {
  if (!isExtensionContext) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ action: 'saveRating', movieId, ratingData }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError)
          resolve(response)
        })
      } catch (e) {
        console.warn("FairRate: sendMessage error", e)
        resolve(false)
      }
    })
  }

  try {
    const existing = await getRating(movieId) || {}
    await ratingsStore.setItem(movieId, {
      ...existing,
      ...ratingData,
      updatedAt: new Date().toISOString()
    })
    
    // Auto-sync to cloud if logged in
    pushToCloud().catch(console.error)
    
    return true
  } catch (err) {
    console.error("Failed to save rating:", err)
    return false
  }
}

/**
 * Get a rating for a specific movie ID
 */
export async function getRating(movieId) {
  if (!isExtensionContext) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ action: 'getRating', movieId }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError)
          resolve(response)
        })
      } catch (e) {
        console.warn("FairRate: sendMessage error", e)
        resolve(null)
      }
    })
  }

  try {
    return await ratingsStore.getItem(movieId)
  } catch (err) {
    console.error("Failed to get rating:", err)
    return null
  }
}

/**
 * Delete a rating for a specific movie ID
 */
export async function deleteRating(movieId) {
  if (!isExtensionContext) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ action: 'deleteRating', movieId }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError)
          resolve(response)
        })
      } catch (e) {
        console.warn("FairRate: sendMessage error", e)
        resolve(false)
      }
    })
  }

  try {
    await ratingsStore.removeItem(movieId)
    
    // Auto-sync to cloud if logged in
    pushToCloud().catch(console.error)
    
    return true
  } catch (err) {
    console.error("Failed to delete rating:", err)
    return false
  }
}

/**
 * Get all saved ratings
 */
export async function getAllRatings() {
  if (!isExtensionContext) return []
  try {
    const ratings = []
    await ratingsStore.iterate((value, key) => {
      ratings.push({ movieId: key, ...value })
    })
    // Sort by most recently updated
    return ratings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  } catch (err) {
    console.error("Failed to get all ratings:", err)
    return []
  }
}

/**
 * Clear all ratings and import new ones
 */
export async function importRatings(jsonData) {
  if (!isExtensionContext) return false
  try {
    const data = JSON.parse(jsonData)
    await ratingsStore.clear()
    for (const [key, value] of Object.entries(data)) {
      await ratingsStore.setItem(key, value)
    }
    return true
  } catch (err) {
    console.error("Failed to import ratings:", err)
    return false
  }
}

/**
 * Export all ratings as JSON string
 */
export async function exportRatings() {
  if (!isExtensionContext) return "{}"
  try {
    const exportData = {}
    await ratingsStore.iterate((value, key) => {
      exportData[key] = value
    })
    return JSON.stringify(exportData, null, 2)
  } catch (err) {
    console.error("Failed to export ratings:", err)
    return "{}"
  }
}

export const DEFAULT_PRESETS = [
  {
    id: 'default-balanced',
    name: 'Balanced (Default)',
    weights: { story: 1, enjoyment: 1, characters: 1, technical: 1, emotional: 1 }
  },
  {
    id: 'default-action',
    name: 'Action / Spectacle',
    weights: { story: 0.8, enjoyment: 1.2, characters: 0.8, technical: 1.5, emotional: 0.7 }
  },
  {
    id: 'default-drama',
    name: 'Character Drama',
    weights: { story: 1.2, enjoyment: 0.8, characters: 1.5, technical: 0.8, emotional: 1.5 }
  }
]

export async function getPresets() {
  if (!isExtensionContext) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ action: 'getPresets' }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError)
          resolve(response || DEFAULT_PRESETS)
        })
      } catch (e) {
        console.warn("FairRate: sendMessage error", e)
        resolve(DEFAULT_PRESETS)
      }
    })
  }
  try {
    const presets = await settingsStore.getItem('presets')
    return presets || DEFAULT_PRESETS
  } catch (err) {
    console.error("Failed to get presets:", err)
    return DEFAULT_PRESETS
  }
}

export async function savePresets(presetsArray) {
  if (!isExtensionContext) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage({ action: 'savePresets', presets: presetsArray }, (response) => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError)
          resolve(response)
        })
      } catch (e) {
        console.warn("FairRate: sendMessage error", e)
        resolve(false)
      }
    })
  }
  try {
    await settingsStore.setItem('presets', presetsArray)
    
    // Auto-sync to cloud if logged in
    pushToCloud().catch(console.error)
    
    return true
  } catch (err) {
    console.error("Failed to save presets:", err)
    return false
  }
}

// --- CLOUD SYNC LOGIC ---

export async function pushToCloud() {
  if (!isExtensionContext) return false;
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) return false;

  try {
    const ratings = await getAllRatings();
    const presets = await getPresets();
    
    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.authToken}`
      },
      body: JSON.stringify({ presets, ratings })
    });
    return response.ok;
  } catch(e) {
    console.error("Cloud push failed", e);
    return false;
  }
}

export async function pullFromCloud() {
  if (!isExtensionContext) return false;
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) return false;
  
  try {
    const response = await fetch(`${API_URL}/sync`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${result.authToken}` }
    });
    
    if (!response.ok) return false;
    const data = await response.json();
    
    // Merge down to local storage
    if (data.presets && data.presets.length > 0) {
      // If cloud has presets, we will use them to override local
      await settingsStore.setItem('presets', data.presets);
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
  } catch(e) {
    console.error("Cloud pull failed", e);
    return false;
  }
}

// --- SOCIAL / FRIENDS LOGIC ---

export async function searchUser(email) {
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) return null;
  
  try {
    const response = await fetch(`${API_URL}/friends?action=search&email=${encodeURIComponent(email)}`, {
      headers: { 'Authorization': `Bearer ${result.authToken}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch(e) {
    return null;
  }
}

export async function getFollowing() {
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) return [];
  
  try {
    const response = await fetch(`${API_URL}/friends?action=list`, {
      headers: { 'Authorization': `Bearer ${result.authToken}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.following || [];
  } catch(e) {
    return [];
  }
}

export async function toggleFollow(targetUserId) {
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) return false;
  
  try {
    const response = await fetch(`${API_URL}/friends`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.authToken}` 
      },
      body: JSON.stringify({ action: 'follow', targetUserId })
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data;
  } catch(e) {
    return false;
  }
}

export async function getFriendsRatings(movieId) {
  const result = await chrome.storage.local.get(['authToken']);
  if (!result.authToken) return [];
  
  try {
    const response = await fetch(`${API_URL}/friends?action=ratings&movieId=${movieId}`, {
      headers: { 'Authorization': `Bearer ${result.authToken}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.ratings || [];
  } catch(e) {
    return [];
  }
}
