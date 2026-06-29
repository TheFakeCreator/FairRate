import {
  saveRating,
  getRating,
  savePresets,
  getPresets,
  deleteRating,
  updateMovieMetadata,
} from "../lib/storage";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveRating") {
    saveRating(request.movieId, request.ratingData).then(sendResponse);
    return true; // Keep channel open for async response
  }
  if (request.action === "getRating") {
    getRating(request.movieId).then(sendResponse);
    return true; // Keep channel open for async response
  }
  if (request.action === "deleteRating") {
    deleteRating(request.movieId).then(sendResponse);
    return true; // Keep channel open for async response
  }
  if (request.action === "savePresets") {
    savePresets(request.presets).then(sendResponse);
    return true;
  }
  if (request.action === "getPresets") {
    getPresets().then(sendResponse);
    return true;
  }
  if (request.action === "updateMovieMetadata") {
    updateMovieMetadata(request.movieId, request.metadata).then(sendResponse);
    return true;
  }
});
