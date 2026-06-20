import localforage from 'localforage'

// Check if we are in the extension background/popup or a content script
// Background worker has no window. Popup has chrome-extension: protocol. Content scripts have https: protocol.
const isExtensionContext = typeof window === 'undefined' || window.location.protocol === 'chrome-extension:'

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
    return true
  } catch (err) {
    console.error("Failed to save presets:", err)
    return false
  }
}

