import React from 'react';
import { MessageSquarePlus, LayoutPanelLeft, Settings, Trash2, MessageSquare } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen
}) => {
  return (
    <div 
      className={`
        flex flex-col h-full bg-[#f0f0f0] border-r border-gray-200 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}
      `}
    >
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-md shadow-sm transition-all active:scale-95 text-sm font-medium"
        >
          <MessageSquarePlus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</div>
        {sessions.length === 0 && (
          <div className="text-center text-gray-400 text-xs py-8">No history yet</div>
        )}
        
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`
              group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors
              ${currentSessionId === session.id 
                ? 'bg-white text-blue-600 shadow-sm font-medium' 
                : 'text-gray-700 hover:bg-gray-200'}
            `}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare size={14} className={currentSessionId === session.id ? 'text-blue-500' : 'text-gray-400'} />
            <span className="truncate flex-1">{session.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity text-gray-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:bg-gray-200 rounded-md text-sm transition-colors">
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <div className="mt-2 px-3 text-[10px] text-gray-400">
          Version 1.0.0 • Web Client
        </div>
      </div>
    </div>
  );
};