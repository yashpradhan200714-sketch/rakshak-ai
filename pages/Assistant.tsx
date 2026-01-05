
import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { generateAssistantResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AssistantProps {
  initialSearchQuery?: string;
  onSearchProcessed?: () => void;
  userLocation?: { lat: number; lng: number };
}

export const Assistant: React.FC<AssistantProps> = ({ initialSearchQuery, onSearchProcessed, userLocation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<'chat' | 'maps'>('chat');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{
            id: 'init',
            sender: 'ai',
            text: "Welcome to Rakshak Tactical Support. I am online and synced with local safety protocols. How may I assist with your safety logistics?",
            timestamp: new Date()
        }]);

        if (initialSearchQuery) {
            setMode('maps');
            handleSend(initialSearchQuery, 'maps');
            if (onSearchProcessed) onSearchProcessed();
        }
    }
  }, [initialSearchQuery]);

  const handleSend = async (text: string, forceMode?: 'chat' | 'maps') => {
    const currentMode = forceMode || mode;
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const defaultLoc = userLocation || { lat: 28.6139, lng: 77.2090 }; 
    await fetchResponse(text, currentMode, defaultLoc);
  };

  const fetchResponse = async (text: string, currentMode: 'chat'|'maps', loc: {lat: number, lng: number}) => {
    const response = await generateAssistantResponse(text, currentMode, loc);
    
    setLoading(false);
    setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date(),
        groundingMetadata: response.groundingMetadata
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 pb-20 animate-in fade-in duration-500">
      <div className="p-4 bg-slate-900 border-b border-slate-800 shadow-xl">
         <h1 className="text-xl font-black text-white mb-4 flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-lg">✦</div>
           Tactical Intelligence
         </h1>
         
         <div className="flex p-1 bg-slate-800 rounded-2xl border border-slate-700">
            <button 
              onClick={() => setMode('chat')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Consult Intel
            </button>
            <button 
              onClick={() => setMode('maps')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'maps' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
               Map Grounding
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-hidden p-2">
          <ChatInterface 
            isAssistantMode={true}
            onAssistantSend={(text) => handleSend(text)}
            messages={messages}
            isLoading={loading}
          />
      </div>
    </div>
  );
};
