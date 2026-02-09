
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, Globe } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'bn-BD', label: 'Bengali (BD)' },
  { code: 'hi-IN', label: 'Hindi (IN)' },
  { code: 'ar-SA', label: 'Arabic (SA)' },
  { code: 'es-ES', label: 'Spanish (ES)' },
  { code: 'fr-FR', label: 'French (FR)' },
  { code: 'ru-RU', label: 'Russian (RU)' },
  { code: 'ja-JP', label: 'Japanese (JP)' },
  { code: 'ur-PK', label: 'Urdu (PK)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'ko-KR', label: 'Korean (KR)' },
];

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micLanguage, setMicLanguage] = useState(navigator.language || 'en-US');
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Dominator, your browser doesn't support voice input yet!");
      return;
    }

    const recognition = new SpeechRecognition();
    // Setting specific language ensures correct word recognition and spelling for that locale
    recognition.lang = micLanguage; 
    recognition.continuous = false;
    recognition.interimResults = true; // Show results as they are detected for a better UX

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      // If the result is final, append it. Otherwise, we could show a preview.
      if (event.results[0].isFinal) {
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
    <footer className="p-4 md:p-6 bg-transparent shrink-0">
      <div className="max-w-4xl mx-auto">
        <div className={`relative flex items-end space-x-3 p-2 rounded-[2rem] border transition-all duration-300 ${
          isListening ? 'bg-indigo-50 border-indigo-200 ring-4 ring-indigo-100 shadow-2xl' : 'bg-white/80 backdrop-blur-xl border-gray-100 shadow-xl shadow-indigo-100/20'
        }`}>
          
          <div className="relative flex flex-col items-center">
            {/* Language Selector for Mic Accuracy */}
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="absolute -top-12 left-0 bg-white border border-gray-100 shadow-xl px-3 py-1.5 rounded-full flex items-center space-x-2 hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-wider text-indigo-600 z-50 whitespace-nowrap"
            >
              <Globe className="w-3 h-3" />
              <span>{SUPPORTED_LANGUAGES.find(l => l.code === micLanguage)?.label || micLanguage}</span>
            </button>

            {showLangMenu && (
              <div className="absolute -top-48 left-0 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 w-40 z-50 animate-in fade-in slide-in-from-bottom-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setMicLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-[10px] font-black uppercase transition-colors ${
                      micLanguage === lang.code ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`p-4 rounded-full transition-all duration-300 shrink-0 shadow-lg active:scale-90 ${
                isListening 
                  ? 'bg-indigo-600 text-white animate-pulse shadow-indigo-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              title="Voice Input (Dominator Accuracy)"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Cereon is processing..." : isListening ? "Listening with high accuracy..." : "Ask Cereon AI :) ..."}
            disabled={isLoading}
            className="flex-1 p-4 bg-transparent border-none focus:ring-0 text-gray-800 font-bold placeholder:text-gray-300 placeholder:font-semibold resize-none text-base md:text-lg leading-relaxed max-h-40 overflow-y-auto scrollbar-hide"
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center disabled:opacity-30 disabled:grayscale shadow-lg shadow-indigo-200 active:scale-90 shrink-0 group"
          >
            <Send className={`w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ${isLoading ? 'animate-pulse' : ''}`} />
          </button>

          {/* Identity Slogan Float */}
          {!input && !isLoading && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden md:flex items-center space-x-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-3 h-3" />
              <span>It's About Identity</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default InputArea;
