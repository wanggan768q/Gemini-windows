import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { createChatSession, sendMessageStream, generateTitle } from './services/geminiService';
import { ChatSession, ChatMessage, Role } from './types';
import { DEFAULT_MODEL } from './constants';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Chat } from '@google/genai';

// Simple UUID generator for browser environment without external deps if needed, 
// but strictly adhering to instructions, I'll use a simple math random for this demo to avoid unlisted deps.
const generateId = () => Math.random().toString(36).substring(2, 15);

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // We need to keep track of the active Chat object from the SDK
  const chatInstances = useRef<Map<string, Chat>>(new Map());
  // Helper ref to access current session ID inside async callbacks if needed
  const currentSessionIdRef = useRef<string | null>(null);

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
          // Don't call handleNewChat directly here to avoid loop if not careful, just clear current
           setCurrentSessionId(null);
           currentSessionIdRef.current = null;
           // Defer creation of new chat
           setTimeout(() => handleNewChat(), 0);
        }
      }
      return filtered;
    });
    chatInstances.current.delete(id);
  }, [handleNewChat]); // Added dependency

  const handleModelChange = useCallback((modelId: string) => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            return { ...s, model: modelId };
        }
        return s;
    }));

    // Re-initialize chat instance with new model. 
    // Note: This effectively resets the context for the SDK side, 
    // but we keep UI history. In a full app, you might want to send history to the new model.
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

    // Update UI immediately with user message
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

    // Generate title if it's the first message
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

      // Create placeholder for model response
      const modelMsgId = generateId();
      const newModelMsg: ChatMessage = {
        id: modelMsgId,
        role: Role.MODEL,
        text: '', // Start empty
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
        // Functional update to append text to the specific message
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

    } catch (error) {
      console.error(error);
      // Mark error state on last message or add error message
       setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
             const msgs = [...s.messages];
             // Check if we added a placeholder model message, if so, mark it as error or remove it?
             // Let's just append an error system message for simplicity in this demo
             return { ...s, messages: [...msgs, { id: generateId(), role: Role.MODEL, text: "Sorry, I encountered an error processing your request.", timestamp: Date.now(), isError: true }] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, sessions]); // Added sessions to dependency

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-screen w-screen bg-windows-bg text-gray-900 font-sans overflow-hidden selection:bg-blue-200">
      <TitleBar />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => { setCurrentSessionId(id); currentSessionIdRef.current = id; }}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isOpen={sidebarOpen}
        />
        
        <div className="flex-1 flex flex-col h-full relative shadow-xl z-10">
            {/* Sidebar Toggle - Floating or integrated? Let's put it in the chat header area conceptually, or floating */}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-3 left-3 z-50 p-1.5 bg-white/80 hover:bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 transition-all"
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
               <div className="flex-1 flex items-center justify-center bg-gray-50">
                   <button onClick={handleNewChat} className="text-blue-600 hover:underline">Start a new chat</button>
               </div>
            )}
        </div>
      </div>
    </div>
  );
}