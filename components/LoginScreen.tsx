import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in with your Google account to continue
            </p>
          </div>

          <div className="w-full pt-4">
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
          </div>
          
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