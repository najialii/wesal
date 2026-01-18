import { GOOGLE_CONFIG, loadGoogleScript } from '../config/google';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface GoogleAuthResponse {
  credential: string;
}

export class GoogleAuthService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await loadGoogleScript();
      
      if (window.google?.accounts?.id) {
        this.initialized = true;
        console.log('Google Identity Services initialized successfully');
      } else {
        throw new Error('Google Identity Services not available');
      }
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  async signIn(): Promise<GoogleUser> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services not initialized'));
        return;
      }

      try {
        // Initialize Google Sign-In with callback
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.clientId,
          callback: (response: GoogleAuthResponse) => {
            try {
              const user = this.parseCredential(response.credential);
              resolve(user);
            } catch (error) {
              reject(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Show the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap is not displayed, fall back to popup
            this.showPopup().then(resolve).catch(reject);
          }
        });

      } catch (error) {
        console.error('Error in Google Sign-In:', error);
        reject(error);
      }
    });
  }

  private async showPopup(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google OAuth2 not available'));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scopes.join(' '),
        callback: async (tokenResponse: any) => {
          try {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error));
              return;
            }

            const userInfo = await this.getUserInfo(tokenResponse.access_token);
            resolve(userInfo);
          } catch (error) {
            reject(error);
          }
        },
      });

      client.requestAccessToken();
    });
  }

  private parseCredential(credential: string): GoogleUser {
    try {
      // Decode JWT token (simple base64 decode for the payload)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token');
      }

      const payload = JSON.parse(atob(parts[1]));
      
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
      };
    } catch (error) {
      console.error('Failed to parse Google credential:', error);
      throw new Error('Failed to parse Google user information');
    }
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();
      
      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture || '',
        given_name: userInfo.given_name || '',
        family_name: userInfo.family_name || '',
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService();