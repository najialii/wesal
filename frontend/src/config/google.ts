export const GOOGLE_CONFIG = {
  clientId: '731847354740-eoghtim5ple035p4kdb2ukbiia274t8r.apps.googleusercontent.com',
  redirectUri: window.location.origin, // This will automatically use the current origin
  scopes: ['openid', 'email', 'profile'],
};

// Load Google Identity Services script
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

declare global {
  interface Window {
    google: any;
  }
}