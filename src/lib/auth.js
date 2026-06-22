// API Base URL (Localhost for dev, Vercel URL for prod)
const API_URL = import.meta.env.PROD 
  ? 'https://fairrate-pi.vercel.app/api' 
  : 'http://localhost:3000/api';

export const signInWithGoogle = async () => {
  return new Promise((resolve, reject) => {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    const redirectUri = chrome.identity.getRedirectURL();
    const scopes = manifest.oauth2.scopes.join(' ');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('prompt', 'select_account');

    chrome.identity.launchWebAuthFlow({
      url: authUrl.href,
      interactive: true
    }, async (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        console.error(chrome.runtime.lastError);
        return reject(chrome.runtime.lastError || new Error('Auth cancelled'));
      }

      // The token is in the URL hash, e.g., #access_token=...&token_type=Bearer&expires_in=...
      const hashParams = new URLSearchParams(new URL(responseUrl).hash.substring(1));
      const token = hashParams.get('access_token');

      if (!token) {
        return reject(new Error('Access token missing from redirect'));
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
  return new Promise(async (resolve) => {
    await chrome.storage.local.remove(['authToken', 'user']);
    resolve();
  });
};

export const getUser = async () => {
  const result = await chrome.storage.local.get(['user']);
  return result.user || null;
};
