
import React from 'react';
import { 
  GraduationCap, 
  RefreshCcw, 
  Code, 
  ImageIcon, 
  Settings, 
  FolderKanban, 
  Youtube 
} from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  onClear: () => void;
  view: AppView;
}

const Header: React.FC<HeaderProps> = ({ onClear, view }) => {
  const getViewConfig = () => {
    switch (view) {
      case 'coding':
        return { 
          title: 'Coding Hub', 
          icon: <Code className="w-6 h-6 mr-3" />, 
          bg: 'bg-zinc-900',
          accent: 'text-emerald-400',
          desc: 'Terminal Mode: Best Coder Helper. logic built with 10x energy.' 
        };
      case 'images':
        return { 
          title: 'Image Lab', 
          icon: <ImageIcon className="w-6 h-6 mr-3" />, 
          bg: 'bg-gradient-to-r from-indigo-700 to-purple-800',
          accent: 'text-white',
          desc: 'Visualize your dominant identity. Imagining at high speed.' 
        };
      case 'settings':
        return { 
          title: 'Identity Settings', 
          icon: <Settings className="w-6 h-6 mr-3" />, 
          bg: 'bg-white border-b border-gray-100 text-gray-900',
          accent: 'text-indigo-600',
          desc: 'Customize your Cereon AI persona and profile details.' 
        };
      case 'projects':
        return { 
          title: 'Mission Control', 
          icon: <FolderKanban className="w-6 h-6 mr-3" />, 
          bg: 'bg-violet-700',
          accent: 'text-violet-100',
          desc: 'Organize your conquests. It\'s about systematic dominance.' 
        };
      default:
        return { 
          title: 'Cereon AI Chat', 
          icon: <GraduationCap className="w-6 h-6 mr-3" />, 
          bg: 'bg-white border-b border-gray-100 text-gray-900',
          accent: 'text-indigo-600',
          desc: 'Relatable Explanations. Human Reactions. Sharp Results.' 
        };
    }
  };

  const config = getViewConfig();
  const isDark = view === 'coding' || view === 'images' || view === 'projects';

  return (
    <header className={`p-5 ${config.bg} ${isDark ? 'text-white' : 'text-gray-900'} shadow-sm flex justify-between items-center transition-all duration-700 shrink-0 sticky top-0 z-40 backdrop-blur-md`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          <span className={config.accent}>{config.icon}</span>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter flex items-center">
            {config.title}
          </h1>
        </div>
        <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60 flex items-center`}>
          <Youtube className="w-3 h-3 mr-1.5" />
          {config.desc}
        </p>
      </div>
      
      {(view === 'chat' || view === 'coding') && (
        <button 
          onClick={onClear} 
          className={`ml-4 text-xs px-4 py-2 rounded-2xl transition-all duration-300 font-black flex items-center shadow-md ${
            isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
          }`}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Clear Conquest</span>
        </button>
      )}
    </header>
  );
};

export default Header;
