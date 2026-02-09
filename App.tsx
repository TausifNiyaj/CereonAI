
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MessageItem from './components/MessageItem';
import InputArea from './components/InputArea';
import CreativeLab from './components/CreativeLab';
import Onboarding from './components/Onboarding';
import SettingsView from './components/SettingsView';
import ProjectsView from './components/ProjectsView';
import { ChatMessage, AppView, ChatSession, Project } from './types';
import { sendMessageToGemini, generateChatTitle } from './services/geminiService';
import { WELCOME_MESSAGE } from './constants';
import { 
  getSessions, 
  saveSession, 
  deleteSession as dbDeleteSession, 
  getUserByName,
  getActiveUserName,
  setActiveUser,
  UserProfile,
  getProjects,
  saveProject,
  saveUserProfile
} from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initData = async (nameOverride?: string) => {
    try {
      const activeName = nameOverride || await getActiveUserName();
      if (!activeName) {
        setIsInitializing(false);
        return;
      }

      const profile = await getUserByName(activeName);
      if (!profile) {
        await setActiveUser(null);
        setIsInitializing(false);
        return;
      }

      const [storedSessions, storedProjects] = await Promise.all([
        getSessions(activeName),
        getProjects(activeName)
      ]);
      
      setUserProfile(profile);
      setProjects(storedProjects);
      setSessions(storedSessions);
      
      if (storedSessions.length > 0) {
        setActiveSessionId(storedSessions[0].id);
      } else {
        const defaultId = Date.now().toString();
        const defaultSession: ChatSession = {
          id: defaultId,
          title: 'First Conquest',
          messages: [{ role: 'model', text: WELCOME_MESSAGE }],
          lastModified: Date.now()
        };
        const sessionWithUser = { ...defaultSession, userName: activeName };
        setSessions([defaultSession]);
        setActiveSessionId(defaultId);
        await saveSession(sessionWithUser);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleLogout = async () => {
    await setActiveUser(null);
    setUserProfile(null);
    setSessions([]);
    setProjects([]);
    setActiveSessionId('');
    setView('chat');
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading, view, scrollToBottom]);

  const triggerGemini = async (currentMessages: ChatMessage[], sessionToUpdate: ChatSession, isFirstMsg: boolean) => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      const isCoding = view === 'coding';
      const response = await sendMessageToGemini(currentMessages, userProfile, isCoding);
      
      let finalTitle = sessionToUpdate.title;
      if (isFirstMsg) {
        const lastUserMsg = currentMessages[currentMessages.length - 1].text;
        finalTitle = await generateChatTitle(lastUserMsg);
      }

      const finalSession: ChatSession = {
        ...sessionToUpdate,
        title: finalTitle,
        messages: [...currentMessages, { 
          role: 'model', 
          text: response.text, 
          groundingUrls: response.groundingUrls 
        }]
      };

      setSessions(prev => prev.map(s => s.id === sessionToUpdate.id ? finalSession : s));
      await saveSession({ ...finalSession, userName: userProfile.fullName });
    } catch (error: any) {
      const errorSession: ChatSession = {
        ...sessionToUpdate,
        messages: [...currentMessages, { role: 'model', text: `Yo, snag: ${error.message}`, isError: true }]
      };
      setSessions(prev => prev.map(s => s.id === sessionToUpdate.id ? errorSession : s));
      await saveSession({ ...errorSession, userName: userProfile.fullName });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeSession || !userProfile) return;
    const userMsg: ChatMessage = { role: 'user', text };
    const updatedMessages = [...activeSession.messages, userMsg];
    const newSessionState = { ...activeSession, messages: updatedMessages, lastModified: Date.now() };
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? newSessionState : s));
    await triggerGemini(updatedMessages, newSessionState, activeSession.messages.length === 1);
  };

  const handleEditMessage = async (index: number, newText: string) => {
    if (!activeSession || !userProfile) return;
    const newMessages = activeSession.messages.slice(0, index);
    newMessages.push({ role: 'user', text: newText });
    
    const updatedSession = { ...activeSession, messages: newMessages, lastModified: Date.now() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? updatedSession : s));
    await triggerGemini(newMessages, updatedSession, index === 1);
  };

  const handleNewChat = async () => {
    if (!userProfile) return;
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Mission',
      messages: [{ role: 'model', text: WELCOME_MESSAGE }],
      lastModified: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setView('chat');
    await saveSession({ ...newSession, userName: userProfile.fullName });
  };

  const handleDeleteSession = async (id: string) => {
    if (!userProfile) return;
    if (sessions.length <= 1) {
      const resetSession: ChatSession = {
        ...sessions[0],
        title: 'Fresh Start',
        messages: [{ role: 'model', text: WELCOME_MESSAGE }],
        lastModified: Date.now()
      };
      setSessions([resetSession]);
      await saveSession({ ...resetSession, userName: userProfile.fullName });
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) setActiveSessionId(filtered[0].id);
    await dbDeleteSession(id);
  };

  const handleLinkToProject = async (sessionId: string, projectId: string) => {
    if (!userProfile) return;
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, projectId: projectId || undefined } : s);
      const affected = updated.find(s => s.id === sessionId);
      if (affected) saveSession({ ...affected, userName: userProfile.fullName });
      return updated;
    });
  };

  const handleProjectUpdate = async () => {
    if (userProfile) initData(userProfile.fullName);
  };

  const handleSaveProject = async (name: string, desc: string) => {
    if (!userProfile) return;
    const project: Project & { userName: string } = {
      id: Date.now().toString(),
      name,
      description: desc,
      createdAt: Date.now(),
      userName: userProfile.fullName
    };
    await saveProject(project);
    handleProjectUpdate();
  };

  const handleProfileUpdate = async (profile: UserProfile) => {
    await saveUserProfile(profile);
    setUserProfile(profile);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-indigo-600">
        <div className="text-white flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-3xl animate-pulse">C</div>
          <p className="font-black uppercase tracking-widest text-sm opacity-50">Cereon Initializing...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Onboarding onComplete={(profile) => initData(profile.fullName)} />;
  }

  const renderView = () => {
    switch (view) {
      case 'chat':
      case 'coding':
        return (
          <div className="flex flex-col h-full bg-[#f7f9fb]">
            <Header view={view} onClear={() => {
              if (!activeSession) return;
              const resetMessages: ChatMessage[] = [{ role: 'model', text: WELCOME_MESSAGE }];
              const resetSession = { ...activeSession, messages: resetMessages, lastModified: Date.now() };
              setSessions(prev => prev.map(s => s.id === activeSessionId ? resetSession : s));
              saveSession({ ...resetSession, userName: userProfile.fullName });
            }} />
            <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              <div className="max-w-4xl mx-auto">
                {activeSession?.messages.map((msg, idx) => (
                  <MessageItem 
                    key={idx} 
                    message={msg} 
                    onEdit={msg.role === 'user' ? (newText) => handleEditMessage(idx, newText) : undefined}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex space-x-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
              </div>
            </main>
            <InputArea onSend={handleSendMessage} isLoading={isLoading} />
          </div>
        );
      case 'images':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <Header view={view} onClear={() => {}} />
            <CreativeLab />
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <Header view={view} onClear={() => {}} />
            <SettingsView profile={userProfile} onUpdate={handleProfileUpdate} />
          </div>
        );
      case 'projects':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <Header view={view} onClear={() => {}} />
            <ProjectsView 
              projects={projects} 
              sessions={sessions} 
              onProjectUpdate={handleProjectUpdate} 
              onSaveProject={handleSaveProject}
              onOpenChat={(id) => { setActiveSessionId(id); setView('chat'); }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        sessions={sessions} 
        projects={projects}
        activeSessionId={activeSessionId}
        setActiveSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        userName={userProfile.fullName}
        userRole={userProfile.role}
        onLinkToProject={handleLinkToProject}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
