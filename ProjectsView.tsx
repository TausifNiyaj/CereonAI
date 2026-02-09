
import React, { useState } from 'react';
import { Project, ChatSession } from '../types';
import { deleteProject } from '../services/storageService';
import { Plus, Folder, Trash2, MessageSquare, ArrowRight, Calendar } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  sessions: ChatSession[];
  onProjectUpdate: () => void;
  onOpenChat: (sessionId: string) => void;
  onSaveProject: (name: string, desc: string) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, sessions, onProjectUpdate, onOpenChat, onSaveProject }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    onSaveProject(newName, newDesc);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project? Associated chats will be unlinked (not deleted).")) {
      await deleteProject(id);
      onProjectUpdate();
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto py-12 px-6 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Project Hub</h2>
            <p className="text-gray-500 font-medium">Group your missions and conquer them systematically.</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center space-x-2 transition shadow-xl shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {showAdd && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in slide-in-from-top duration-300 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Project Name</label>
                <input 
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                  placeholder="e.g., SSC Exam Prep"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Description (Optional)</label>
                <input 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                  placeholder="Goals and notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowAdd(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={handleAdd} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Create</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projects.map(project => {
            const projectChats = sessions.filter(s => s.projectId === project.id);
            return (
              <div key={project.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-8 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{project.description || 'No description'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(project.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      <MessageSquare className="w-3 h-3 mr-1.5" />
                      Related Chats ({projectChats.length})
                    </div>
                    {projectChats.length > 0 ? (
                      <div className="space-y-2">
                        {projectChats.slice(0, 3).map(chat => (
                          <div 
                            key={chat.id} 
                            onClick={() => onOpenChat(chat.id)}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors group"
                          >
                            <span className="text-sm font-semibold text-gray-700 truncate">{chat.title}</span>
                            <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        ))}
                        {projectChats.length > 3 && (
                          <p className="text-[10px] text-center font-bold text-gray-400 uppercase">+{projectChats.length - 3} more chats</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic font-medium">No chats linked yet.</p>
                    )}
                  </div>
                </div>
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                   <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                     <Calendar className="w-3 h-3 mr-1" />
                     Created {new Date(project.createdAt).toLocaleDateString()}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectsView;
