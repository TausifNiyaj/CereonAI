
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Code, 
  FolderKanban, 
  Settings, 
  Plus, 
  Trash2,
  Youtube,
  Search,
  ChevronDown,
  FolderOpen,
  Users,
  LogOut
} from 'lucide-react';
import { AppView, ChatSession, Project } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  sessions: ChatSession[];
  projects: Project[];
  activeSessionId: string;
  setActiveSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  userName: string;
  userRole?: string;
  onLinkToProject: (sessionId: string, projectId: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  sessions, 
  projects,
  activeSessionId, 
  setActiveSession,
  onNewChat,
  onDeleteSession,
  userName,
  userRole,
  onLinkToProject,
  onLogout
}) => {
  const [showProjectPicker, setShowProjectPicker] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const navItems = [
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'images', label: 'Image Lab', icon: ImageIcon },
    { id: 'coding', label: 'Coding Hub', icon: Code },
    { id: 'projects', label: 'Project Hub', icon: FolderKanban },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-72 h-full bg-white border-r border-gray-100 flex flex-col shrink-0 hidden md:flex">
      {/* Brand & Identity */}
      <div className="p-6 border-b border-gray-50 bg-gradient-to-b from-indigo-50/30 to-white">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">C</div>
          <h1 className="font-black text-2xl text-gray-900 tracking-tighter">Cereon AI</h1>
        </div>
        <div className="flex items-center text-[10px] text-indigo-600 font-black tracking-widest uppercase opacity-70">
          <Youtube className="w-3.5 h-3.5 mr-1.5" />
          Relatable Dominator
        </div>
      </div>

      {/* Main Controls */}
      <div className="p-4 space-y-1">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-2xl transition-all shadow-xl shadow-indigo-100 mb-6 font-black group active:scale-95"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>New Conquest</span>
        </button>

        <div className="space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as AppView)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-black shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-semibold'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* History Search & List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
        <div className="relative mb-4 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search missions..."
            className="w-full bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">History</span>
        </div>
        
        <div className="space-y-1 flex-1">
          {filteredSessions.map((session) => (
            <div key={session.id} className="relative group">
              <div 
                className={`flex items-center justify-between p-3 rounded-xl text-sm cursor-pointer transition-all ${
                  activeSessionId === session.id && (currentView === 'chat' || currentView === 'coding')
                    ? 'bg-gray-100 text-gray-900 font-bold'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setActiveSession(session.id);
                  setView('chat');
                }}
              >
                <div className="flex flex-col truncate flex-1 pr-2">
                   <span className="truncate">{session.title}</span>
                   {session.projectId && (
                     <span className="text-[9px] font-black text-indigo-500 flex items-center mt-0.5 uppercase tracking-tighter">
                       <FolderOpen className="w-2.5 h-2.5 mr-1" />
                       {projects.find(p => p.id === session.projectId)?.name}
                     </span>
                   )}
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProjectPicker(showProjectPicker === session.id ? null : session.id);
                    }}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {showProjectPicker === session.id && (
                <div className="absolute left-[calc(100%-10px)] top-0 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 min-w-[180px] animate-in slide-in-from-left-2 duration-200">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest p-2 border-b border-gray-50 mb-1">Link to Project</p>
                  <div className="max-h-[200px] overflow-y-auto py-1">
                    <button 
                      onClick={() => { onLinkToProject(session.id, ''); setShowProjectPicker(null); }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-[11px] font-bold text-gray-500"
                    >
                      (Unlink Project)
                    </button>
                    {projects.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { onLinkToProject(session.id, p.id); setShowProjectPicker(null); }}
                        className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 text-[11px] font-bold text-gray-700 truncate"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Squad Room Integration */}
        <div className="mt-6 pt-6 border-t border-gray-50">
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Squad Room</span>
          </div>
          <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-indigo-50 group transition-all text-gray-500 hover:text-indigo-600">
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white flex items-center justify-center transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">10x Dominators</span>
          </button>
        </div>
      </div>

      {/* Modern Profile Footer with Logout */}
      <div className="p-4 border-t border-gray-50 bg-gray-50/30">
        <div className="group relative flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-white hover:shadow-sm cursor-pointer transition-all active:scale-95">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">{userName}</p>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest truncate">{userRole || 'Dominator'}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onLogout(); }}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Switch Identity"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
