import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Bot, User, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Role, ModelOption } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, modelId: string) => void;
  isLoading: boolean;
  currentModelId: string;
  onModelChange: (id: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentModelId,
  onModelChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    onSendMessage(inputValue, currentModelId);
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-white/50 relative">
      
      {/* Header / Model Selector */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Model:</span>
          <select 
            value={currentModelId}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-transparent font-semibold text-gray-800 text-sm focus:outline-none cursor-pointer hover:text-blue-600 transition-colors"
          >
            {AVAILABLE_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth space-y-6 custom-scrollbar">
        {messages.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
             <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Gemini" className="w-24 h-24 mb-4 grayscale" />
             <p className="text-xl font-semibold">How can I help you today?</p>
           </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm
                ${msg.role === Role.USER ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}
              `}>
                {msg.role === Role.USER ? <User size={16} /> : <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" className="w-5 h-5" />}
              </div>

              {/* Bubble */}
              <div className={`
                px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group
                ${msg.role === Role.USER 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}
              `}>
                 {msg.role === Role.MODEL ? (
                    <div className="markdown-body prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                 ) : (
                   <div className="whitespace-pre-wrap">{msg.text}</div>
                 )}
                 
                 {msg.isError && (
                   <div className="mt-2 text-xs text-red-200 font-medium border-t border-red-400/30 pt-1">
                     Failed to send
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex gap-3 max-w-[75%]">
               <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" className="w-5 h-5 animate-pulse" />
               </div>
               <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                 <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                 <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                 <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini..."
              className="w-full max-h-32 bg-transparent border-none resize-none focus:ring-0 py-2 px-2 text-gray-800 text-sm placeholder-gray-400"
              rows={1}
            />
            <button 
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || isLoading}
              className={`
                p-2 rounded-xl mb-0.5 transition-all duration-200
                ${!inputValue.trim() || isLoading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
              `}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-400">
              Gemini can make mistakes. Review generated info.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};