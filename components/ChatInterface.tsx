
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Helper, EmergencyStatus, EmergencyType } from '../types';
import { generateEmergencyResponse, generateSpeech, analyzeImage } from '../services/geminiService';
import { Camera, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface ChatInterfaceProps {
  initialMessage?: string;
  helper?: Helper | null;
  status?: EmergencyStatus;
  onEmergencyClassified?: (type: EmergencyType, severity: string) => void;
  isAssistantMode?: boolean;
  onAssistantSend?: (text: string) => void;
  messages?: ChatMessage[];
  isLoading?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  initialMessage, 
  helper, 
  status,
  onEmergencyClassified,
  isAssistantMode = false,
  onAssistantSend,
  messages: externalMessages,
  isLoading: externalIsLoading
}) => {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = isAssistantMode && externalMessages ? externalMessages : localMessages;
  const isLoading = isAssistantMode ? externalIsLoading : internalLoading;

  useEffect(() => {
    if (!isAssistantMode && initialMessage && localMessages.length === 0) {
        addMessage('system', initialMessage);
        handleEmergencyResponse(initialMessage, []);
    }
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender: 'user' | 'ai' | 'system', text: string, metadata?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date(),
      groundingMetadata: metadata
    };
    if (!isAssistantMode) {
      setLocalMessages(prev => [...prev, newMessage]);
    }
    return newMessage;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          addMessage('user', "Tactical Intel Uploaded: [Visual Data]");
          setInternalLoading(true);
          const response = await analyzeImage(base64, file.type);
          setInternalLoading(false);
          addMessage('ai', response.text);
          if (onEmergencyClassified) onEmergencyClassified(response.type, response.severity);
          playTTS(response.text, Date.now().toString());
      };
      reader.readAsDataURL(file);
  };

  const handleEmergencyResponse = async (userText: string, currentHistory: ChatMessage[]) => {
    setInternalLoading(true);
    const aiResponse = await generateEmergencyResponse(currentHistory, userText);
    
    setInternalLoading(false);
    addMessage('ai', aiResponse.text);
    
    if (!isAssistantMode) {
         playTTS(aiResponse.text, Date.now().toString());
    }

    if (onEmergencyClassified) {
        onEmergencyClassified(aiResponse.type, aiResponse.severity);
    }
  };

  const handleSend = (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
    
    if (isAssistantMode && onAssistantSend) {
        onAssistantSend(textToSend);
        setInput('');
    } else {
        const userMsg = addMessage('user', textToSend);
        setInput('');
        handleEmergencyResponse(textToSend, [...localMessages, userMsg]);
    }
  };

  const playTTS = async (text: string, id: string) => {
    if (playingAudioId === id) return;
    setPlayingAudioId(id);
    
    const audioData = await generateSpeech(text);
    if (audioData) {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        try {
            const pcm16 = new Int16Array(audioData);
            const audioBuffer = ctx.createBuffer(1, pcm16.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < pcm16.length; i++) {
                channelData[i] = pcm16[i] / 32768.0;
            }
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);
            source.onended = () => setPlayingAudioId(null);
        } catch (e) {
            console.error(e);
            setPlayingAudioId(null);
        }
    } else {
        setPlayingAudioId(null);
    }
  };

  const renderGrounding = (metadata: any) => {
    if (!metadata || !metadata.groundingChunks) return null;
    return (
        <div className="mt-4 space-y-3">
            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded w-max">Tactical Assets Located</div>
            {metadata.groundingChunks.map((chunk: any, i: number) => {
                const maps = chunk.maps;
                if (!maps) return null;
                return (
                    <a key={i} href={maps.uri} target="_blank" rel="noopener noreferrer" 
                       className="bg-slate-900/80 p-4 rounded-2xl flex items-center justify-between border border-blue-500/20 hover:border-blue-500 transition-all active:scale-95 shadow-lg group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-xl border border-blue-500/30">
                                📍
                            </div>
                            <div>
                                <div className="text-xs font-black text-white leading-tight group-hover:text-blue-400 transition-colors">{maps.title}</div>
                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Verified Safety Asset</div>
                            </div>
                        </div>
                        <LinkIcon className="text-blue-500" size={16} />
                    </a>
                );
            })}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div className="bg-slate-900/90 p-5 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-blue-400 flex items-center gap-3">
          <span className={`w-2.5 h-2.5 ${isAssistantMode ? 'bg-blue-400' : 'bg-red-500'} rounded-full animate-pulse shadow-[0_0_10px_currentColor]`}></span>
          {isAssistantMode ? 'Rakshak AI Intelligence' : 'Rakshak AI Support'}
        </h3>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
        />
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-500 hover:text-white transition-colors"
        >
            <Camera size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              max-w-[92%] rounded-[2rem] px-6 py-4 text-sm leading-relaxed relative group transition-all
              ${msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-xl border-t border-white/10' 
                : msg.sender === 'system'
                  ? 'bg-red-600 text-white font-black text-center w-full rounded-2xl animate-pulse shadow-lg'
                  : 'bg-slate-800 text-slate-50 border border-slate-700 rounded-bl-none shadow-lg'}
            `}>
              {msg.sender === 'ai' && !isAssistantMode && (
                  <div className="text-[9px] font-black text-red-500 mb-2 tracking-[0.2em] uppercase bg-red-500/10 w-max px-2 py-0.5 rounded">Rakshak AI Directive</div>
              )}
              <div className={`${msg.sender === 'ai' && !isAssistantMode ? 'text-lg font-black tracking-tight leading-tight' : 'font-medium'}`}>
                {msg.text}
              </div>

              {msg.sender === 'ai' && (
                <button 
                  onClick={() => playTTS(msg.text, msg.id)}
                  className={`absolute -right-12 top-2 p-2.5 rounded-full transition-all ${playingAudioId === msg.id ? 'text-green-400 scale-125' : 'text-slate-600 hover:text-white'}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                </button>
              )}
            </div>
            
            {msg.groundingMetadata && renderGrounding(msg.groundingMetadata)}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 rounded-full px-6 py-3 border border-slate-700 flex items-center gap-3">
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
               <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Rakshak AI Syncing</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-5 bg-slate-900 border-t border-slate-800 flex gap-4 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Rakshak AI for a directive..."
          className="flex-1 bg-slate-800/50 border-2 border-slate-700 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-blue-600 focus:bg-slate-800 transition-all font-medium"
        />
        <button 
          onClick={() => handleSend()}
          className="bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 active:scale-90 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};
