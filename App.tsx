import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LoginScreen } from './components/LoginScreen';
import { createChatSession, sendMessageStream, generateTitle } from './services/geminiService';
import { ChatSession, ChatMessage, Role } from './types';
import { DEFAULT_MODEL } from './constants';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Chat } from '@google/genai';

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 15);

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth & Theme state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // We need to keep track of the active Chat object from the SDK
  const chatInstances = useRef<Map<string, Chat>>(new Map());
  const currentSessionIdRef = useRef<string | null>(null);

  // Initialize theme and auth check
  useEffect(() => {
    // Theme check
    const savedTheme = localStorage.getItem('gemini-desktop-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    // Auth check using window.aistudio
    const checkAuth = async () => {
      try {
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (hasKey) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    };
    checkAuth();
  }, []);

  // Apply theme class to html
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gemini-desktop-theme', theme);
  }, [theme]);

  // Load sessions from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemini-desktop-sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          currentSessionIdRef.current = parsed[0].id;
        } else {
            handleNewChat();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        handleNewChat();
      }
    } else {
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save sessions to local storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
        localStorage.setItem('gemini-desktop-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleLogin = async () => {
    try {
      const success = await (window as any).aistudio?.openSelectKey();
      if (success) {
        setIsAuthenticated(true);
        // Re-initialize current chat if it exists to pick up new key
        if (currentSessionId) {
            const session = sessions.find(s => s.id === currentSessionId);
            if (session) {
               chatInstances.current.set(currentSessionId, createChatSession(session.model));
            }
        }
      }
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleNewChat = useCallback(() => {
    const newId = generateId();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [],
      lastUpdated: Date.now(),
      model: DEFAULT_MODEL
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    currentSessionIdRef.current = newId;
    
    // Initialize SDK Chat instance
    chatInstances.current.set(newId, createChatSession(DEFAULT_MODEL));
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (id === currentSessionIdRef.current) {
        if (filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
          currentSessionIdRef.current = filtered[0].id;
        } else {
           setCurrentSessionId(null);
           currentSessionIdRef.current = null;
           setTimeout(() => handleNewChat(), 0);
        }
      }
      return filtered;
    });
    chatInstances.current.delete(id);
  }, [handleNewChat]);

  const handleModelChange = useCallback((modelId: string) => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            return { ...s, model: modelId };
        }
        return s;
    }));

    chatInstances.current.set(currentSessionId, createChatSession(modelId));
  }, [currentSessionId]);

  const handleSendMessage = useCallback(async (text: string, modelId: string) => {
    if (!currentSessionId) return;

    const messageId = generateId();
    const newUserMsg: ChatMessage = {
      id: messageId,
      role: Role.USER,
      text: text,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: [...s.messages, newUserMsg],
          lastUpdated: Date.now()
        };
      }
      return s;
    }));

    setIsLoading(true);

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0) {
        generateTitle(text).then(title => {
            setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s));
        });
    }

    try {
      let chat = chatInstances.current.get(currentSessionId);
      if (!chat) {
        chat = createChatSession(modelId);
        chatInstances.current.set(currentSessionId, chat);
      }

      const modelMsgId = generateId();
      const newModelMsg: ChatMessage = {
        id: modelMsgId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, newModelMsg] };
        }
        return s;
      }));

      const stream = sendMessageStream(chat, text);
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const msgs = [...s.messages];
            const lastMsgIndex = msgs.findIndex(m => m.id === modelMsgId);
            if (lastMsgIndex !== -1) {
                msgs[lastMsgIndex] = { ...msgs[lastMsgIndex], text: fullText };
            }
            return { ...s, messages: msgs };
          }
          return s;
        }));
      }

    } catch (error: any) {
      console.error(error);
      
      // Handle Auth Errors gracefully
      if (error.message && error.message.includes('Requested entity was not found')) {
         setIsAuthenticated(false); // Force re-login
      }

       setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
             const msgs = [...s.messages];
             return { ...s, messages: [...msgs, { id: generateId(), role: Role.MODEL, text: "Error: Failed to generate response. Please check your connection or sign in again.", timestamp: Date.now(), isError: true }] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-screen w-screen bg-windows-bg dark:bg-windows-dark-bg text-gray-900 dark:text-gray-100 font-sans overflow-hidden selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-300">
      <TitleBar />
      
      {!isAuthenticated ? (
        <div className="flex-1 relative overflow-hidden">
           <LoginScreen onLogin={handleLogin} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar 
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => { setCurrentSessionId(id); currentSessionIdRef.current = id; }}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            isOpen={sidebarOpen}
            theme={theme}
            onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          />
          
          <div className="flex-1 flex flex-col h-full relative shadow-xl z-10">
              <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="absolute top-3 left-3 z-50 p-1.5 bg-white/80 dark:bg-[#2c2c2c]/80 hover:bg-white dark:hover:bg-[#3a3a3a] rounded-md shadow-sm border border-gray-200 dark:border-[#444] text-gray-500 dark:text-gray-400 transition-all"
                  title="Toggle Sidebar"
              >
                  {sidebarOpen ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}
              </button>

              {currentSession ? (
                <ChatWindow 
                  messages={currentSession.messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  currentModelId={currentSession.model}
                  onModelChange={handleModelChange}
                />
              ) : (
                 <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#202020]">
                     <button onClick={handleNewChat} className="text-blue-600 hover:underline dark:text-blue-400">Start a new chat</button>
                 </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}