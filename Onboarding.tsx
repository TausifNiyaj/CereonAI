
import React, { useState } from 'react';
import { 
  UserProfile, 
  saveUserProfile, 
  checkUserExists, 
  getUserByName, 
  setActiveUser 
} from '../services/storageService';
import { Youtube, ArrowRight, Sparkles, UserCheck, UserPlus, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !password.trim()) return;
    setIsLoading(true);

    try {
      const exists = await checkUserExists(fullName.trim());

      if (mode === 'signup') {
        if (exists) {
          setError('This Identity is already claimed, Dominator! Try Logging in.');
          setIsLoading(false);
          return;
        }
        const profile: UserProfile = {
          fullName: fullName.trim(),
          password: password.trim(), // Security reason: added password
          role: role.trim() || undefined,
          goal: goal.trim() || undefined
        };
        await saveUserProfile(profile);
        await setActiveUser(profile.fullName);
        onComplete(profile);
      } else {
        if (!exists) {
          setError('Identity not found. Join the Squad first!');
          setIsLoading(false);
          return;
        }
        const profile = await getUserByName(fullName.trim());
        if (profile) {
          if (profile.password !== password.trim()) {
            setError('Access Denied. Incorrect password for this identity.');
            setIsLoading(false);
            return;
          }
          await setActiveUser(profile.fullName);
          onComplete(profile);
        }
      }
    } catch (e) {
      setError('Technical snag in the Vault. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Visual Side */}
      <div className="md:w-1/2 bg-indigo-600 p-12 flex flex-col justify-between text-white relative">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl shadow-xl">C</div>
            <h1 className="text-3xl font-black tracking-tighter">Cereon AI</h1>
          </div>
          <h2 className="text-5xl md:text-6xl font-black leading-tight mb-6">
            IT'S ABOUT <br /><span className="text-indigo-200">IDENTITY.</span>
          </h2>
          <p className="text-xl text-indigo-100 font-medium max-w-md">
            Unlock your custom AI brain. One name, one password, total dominance.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center space-x-4">
           <div className="flex items-center space-x-2 text-indigo-200 font-bold uppercase tracking-widest text-sm">
            <Youtube className="w-5 h-5" />
            <span>Relatable Dominator</span>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 -ml-48 -mb-48"></div>
      </div>

      {/* Form Side */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-gray-50 overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Mode Switcher */}
          <div className="flex p-1.5 bg-gray-200 rounded-2xl w-full">
            <button 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-black text-sm transition-all ${mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Join the Squad</span>
            </button>
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-black text-sm transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Return to Command</span>
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900">{mode === 'signup' ? 'Claim Your Name' : 'Identity Check'}</h3>
            <p className="text-gray-500 font-medium text-sm">
              {mode === 'signup' 
                ? 'Choose a unique name and password to start your legacy.' 
                : 'Enter your credentials to restore all your missions.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tayab Nafis"
                className={`w-full p-4 bg-white border-2 rounded-2xl shadow-sm outline-none transition-all text-gray-800 font-black text-lg ${error && error.includes('Identity') ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:border-indigo-600'}`}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Key (Password)</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-4 pl-12 bg-white border-2 rounded-2xl shadow-sm outline-none transition-all text-gray-800 font-black text-lg ${error && error.includes('password') ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:border-indigo-600'}`}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-1.5 text-red-500 text-xs font-bold mt-2 animate-in slide-in-from-top-1 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-5 animate-in fade-in duration-500">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Path</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl shadow-sm outline-none transition-all text-gray-800 font-bold"
                  >
                    <option value="">Select your path...</option>
                    <option value="Student">Student (SSC/HSC/Uni)</option>
                    <option value="Developer">Software Developer</option>
                    <option value="Entrepreneur">Entrepreneur</option>
                    <option value="Creator">Content Creator</option>
                    <option value="Hobbyist">Just curious</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Goal</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Crush SSC Exams, Build an App..."
                    className="w-full p-4 bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl shadow-sm outline-none transition-all text-gray-800 font-bold"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!fullName.trim() || !password.trim() || isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-5 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all shadow-xl shadow-indigo-100 group active:scale-95 mt-4"
            >
              <span>{isLoading ? 'Verifying Identity...' : mode === 'signup' ? 'Initialize Cereon' : 'Authorize Entrance'}</span>
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-400 font-black uppercase tracking-widest pt-4">
            <Sparkles className="w-3 h-3" />
            <span>Secure Local Identity Vault</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
