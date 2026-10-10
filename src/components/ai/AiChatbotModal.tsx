import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChatMessage } from '../../types';
import { Bot, Send, Mic, X, Sparkles, MapPin, PhoneCall, HelpCircle } from 'lucide-react';

interface AiChatbotModalProps {
  onClose: () => void;
  onOpenRegistration: () => void;
}

export const AiChatbotModal: React.FC<AiChatbotModalProps> = ({ onClose, onOpenRegistration }) => {
  const { language, setLanguage } = useLanguage();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'bot',
      text: 'Hello! I am RescuAid AI Assistant. How can I assist you today? You can ask about disaster registration, nearest relief camps, or aid eligibility.',
      timestamp: 'Just now'
    }
  ]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate intelligent AI Response
    setTimeout(() => {
      let replyText = 'I am processing your query against our Disaster Relief database. ';
      const lower = text.toLowerCase();

      if (lower.includes('camp') || lower.includes('shelter') || lower.includes('stay')) {
        replyText = 'The nearest active Relief Camp is St. Joseph Higher Sec. Relief Center in Cuddalore (Capacity: 1200, 360 beds available). Emergency Doctor: Dr. V. Arulmani.';
      } else if (lower.includes('register') || lower.includes('apply') || lower.includes('ration')) {
        replyText = 'To register as a disaster victim, click on the "+ Register Victim" button. You will need your Aadhaar card or Govt ID to generate your Smart QR pass.';
      } else if (lower.includes('helpline') || lower.includes('sos') || lower.includes('phone')) {
        replyText = 'Emergency Helplines: 1077 (District Relief Control), 112 (National Emergency), 108 (Ambulance). Click the SOS Emergency button at top right for 1-click rescue.';
      } else {
        replyText = `Thank you for reaching out. Based on your location in Cuddalore, 1,500 food kits and 8,000L water supplies are currently available at St. Joseph Camp.`;
      }

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: 'Just now'
      };

      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage('Where is the nearest relief camp and drinking water supply?');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[600px]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-white text-sm">RescuAid AI Chatbot</h4>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  MULTILINGUAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Voice-enabled relief assistance</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="bg-slate-950/50 p-2.5 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => handleSendMessage('Where is the nearest relief camp?')}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 whitespace-nowrap"
          >
            🏕️ Nearest Camp
          </button>
          <button
            onClick={() => handleSendMessage('How to register for aid ration?')}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 whitespace-nowrap"
          >
            📋 Registration Help
          </button>
          <button
            onClick={() => handleSendMessage('Give emergency medical numbers')}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 whitespace-nowrap"
          >
            🚑 Medical SOS
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-medium shadow-md'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-[9px] opacity-75 block text-right mt-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <button
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Voice Interaction (Mic)"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={isListening ? 'Listening for speech...' : 'Type your relief question in any language...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />

          <button
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
