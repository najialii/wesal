import { useState } from 'react';
import { Button } from './button';
import { googleAuthService } from '../../services/googleAuth';
import { authService } from '../../services/auth';

export function GoogleAuthDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testGoogleAuth = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('Starting Google Authentication Test...');
      
      // Check popup blocker
      const isPopupBlocked = googleAuthService.isPopupBlocked();
      addLog(`Popup blocker status: ${isPopupBlocked ? 'BLOCKED' : 'ALLOWED'}`);
      
      // Initialize Google Auth
      addLog('Initializing Google Auth Service...');
      await googleAuthService.initialize();
      addLog('Google Auth Service initialized successfully');
      
      // Test Google Sign-In
      addLog('Attempting Google Sign-In...');
      const googleUser = await googleAuthService.signIn();
      addLog(`Google user received: ${googleUser.email}`);
      
      // Test backend authentication
      addLog('Authenticating with backend...');
      const response = await authService.googleAuth(googleUser);
      addLog(`Backend authentication successful: ${response.user.email}`);
      
      addLog('✅ Google Authentication Test PASSED');
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      console.error('Google Auth Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLoading(true);
    setLogs([]);
    
    try {
      addLog('Testing backend connection...');
      
      const testData = {
        google_id: 'test_123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        given_name: 'Test',
        family_name: 'User'
      };
      
      const response = await fetch('/api/test-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog('✅ Backend connection test PASSED');
        addLog(`Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorData = await response.text();
        addLog(`❌ Backend connection test FAILED: ${response.status}`);
        addLog(`Error: ${errorData}`);
      }
      
    } catch (error: any) {
      addLog(`❌ Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Google Auth Debug Tool</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Button 
            onClick={testGoogleAuth} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : 'Test Google Auth Flow'}
          </Button>
          
          <Button 
            onClick={testBackendConnection} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Backend Connection'}
          </Button>
          
          <Button 
            onClick={clearLogs} 
            variant="outline"
          >
            Clear Logs
          </Button>
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
        <div className="mb-2 text-gray-400">Debug Console:</div>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click a test button to start.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Common Issues & Solutions:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Popup Blocked:</strong> Allow popups for this site in browser settings</li>
          <li>• <strong>CORS Error:</strong> Check backend CORS configuration</li>
          <li>• <strong>FedCM Error:</strong> Try disabling third-party cookies or use incognito mode</li>
          <li>• <strong>Client ID Error:</strong> Verify Google OAuth client configuration</li>
          <li>• <strong>Redirect URI:</strong> Ensure localhost:5175 is added to Google Console</li>
        </ul>
      </div>
    </div>
  );
}
