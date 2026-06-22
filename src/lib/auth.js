// API Base URL (Localhost for dev, Vercel URL for prod)
const API_URL = import.meta.env.PROD 
  ? 'https://fairrate-pi.vercel.app/api' 
  : 'http://localhost:3000/api';

export const signInWithGoogle = async () => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error(chrome.runtime.lastError);
        return reject(chrome.runtime.lastError);
      }

      try {
        // Exchange Google token for our backend JWT
        const response = await fetch(`${API_URL}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!response.ok) throw new Error('Failed to authenticate with backend');
        
        const data = await response.json();
        
        // Save JWT and User Info securely in local storage
        await chrome.storage.local.set({ 
          authToken: data.token,
          user: data.user
        });

        resolve(data.user);
      } catch (error) {
        console.error('SignIn error:', error);
        reject(error);
      }
    });
  });
};

export const signOut = async () => {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        // Revoke token from Google
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
        chrome.identity.removeCachedAuthToken({ token }, async () => {
          await chrome.storage.local.remove(['authToken', 'user']);
          resolve();
        });
      } else {
        chrome.storage.local.remove(['authToken', 'user']).then(resolve);
      }
    });
  });
};

export const getUser = async () => {
  const result = await chrome.storage.local.get(['user']);
  return result.user || null;
};
