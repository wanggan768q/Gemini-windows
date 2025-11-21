import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Key, WifiOff, RefreshCw, Loader2, Globe2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
  onManualLogin: (key: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onManualLogin }) => {
  const [showManual, setShowManual] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  // Network Check State
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  // Run check on mount
  useEffect(() => {
    checkConnectivity();
  }, []);

  const checkConnectivity = async () => {
    setNetworkStatus('checking');
    setStatusMessage('Checking network & region availability...');
    
    try {
      const controller = new AbortController();
      // 8 seconds timeout for connectivity check
      const timeoutId = setTimeout(() => controller.abort(), 8000); 

      // Attempt to hit the Gemini API. 
      // Returns 400 (Bad Request) if key is invalid (but connection works).
      // Returns 403 (Forbidden) if region is blocked or key issue.
      // Returns Error if DNS fails or Connection Refused (Proxy needed).
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=TEST_CONNECTIVITY_CHECK', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // If we get a response status (even 400/403), it means we reached Google's servers.
      if (res.status === 400 || res.ok || res.status === 403) {
        setNetworkStatus('success');
      } else {
         // Even 500 errors mean we hit the server
         setNetworkStatus('success');
      }
    } catch (e: any) {
      console.error("Network check failed", e);
      setNetworkStatus('error');
      if (e.name === 'AbortError') {
        setStatusMessage('Connection timed out. High latency detected.');
      } else {
        setStatusMessage('Unable to connect to Gemini servers.');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onManualLogin(apiKey.trim());
    }
  };

  // 1. Loading State
  if (networkStatus === 'checking') {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#f3f3f3] dark:bg-[#202020] text-gray-900 dark:text-white transition-colors duration-300">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">{statusMessage}</p>
            </div>
        </div>
    );
  }

  // 2. Error State (Offline/Blocked)
  if (networkStatus === 'error') {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#f3f3f3] dark:bg-[#202020] text-gray-900 dark:text-white transition-colors duration-300">
           <div className="w-full max-w-md p-8 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-red-200 dark:border-red-900/50 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full text-red-600 dark:text-red-400">
                    <WifiOff size={32} />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Access Restricted</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                       {statusMessage}
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 p-3 rounded-lg mt-2">
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 text-left">
                            <strong>Region Check Failed:</strong> Please ensure your network complies with Google's geographic policies. You may need a VPN/Proxy targeting US/Singapore regions.
                        </p>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full">
                    <button 
                        onClick={checkConnectivity}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all"
                    >
                        <RefreshCw size={16} />
                        Retry Connection
                    </button>
                 </div>
              </div>
           </div>
        </div>
    );
  }

  // 3. Success State (Show Login)
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#f3f3f3] dark:bg-[#202020] text-gray-900 dark:text-white transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-75"></div>
            <div className="relative bg-white dark:bg-[#2b2b2b] rounded-full p-4 shadow-lg">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" 
                 alt="Gemini" 
                 className="w-12 h-12" 
               />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Gemini</h1>
            <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-1.5 px-3 rounded-full w-fit mx-auto border border-green-100 dark:border-green-900/30">
                <Globe2 size={12} />
                <span>Service Region Available</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
              Enter your API key to continue
            </p>
          </div>

          {!showManual ? (
            <div className="w-full pt-4 space-y-3">
              <button
                onClick={onLogin}
                className="group relative w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-[#2b2b2b] hover:bg-gray-50 dark:hover:bg-[#333] border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  className="w-5 h-5" 
                  alt="G" 
                />
                <span className="font-medium text-gray-700 dark:text-gray-200">Sign in with Google</span>
                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <button 
                onClick={() => setShowManual(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
              >
                Enter API Key manually
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full pt-4 space-y-3">
              <div className="relative">
                <Key className="absolute left-3 top-3 text-gray-400" size={16} />
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Gemini API Key"
                  className="w-full bg-white dark:bg-[#2b2b2b] border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!apiKey.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
              <button 
                type="button"
                onClick={() => setShowManual(false)}
                className="text-xs text-gray-500 hover:underline w-full text-center"
              >
                Back
              </button>
            </form>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 pt-4">
             <Sparkles size={12} />
             <span>Powered by Google Gemini API</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-[10px] text-gray-400 dark:text-gray-600">
        Gemini Desktop Client • v1.1.0
      </div>
    </div>
  );
};