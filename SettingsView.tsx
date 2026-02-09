
import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../services/storageService';
import { Save, User, BrainCircuit, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ profile, onUpdate }) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [password, setPassword] = useState(profile.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(profile.role || '');
  const [goal, setGoal] = useState(profile.goal || '');
  const [personalization, setPersonalization] = useState(profile.personalization || '');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const newProfile: UserProfile = {
      fullName: fullName.trim(),
      password: password.trim(),
      role: role.trim() || undefined,
      goal: goal.trim() || undefined,
      personalization: personalization.trim() || undefined,
    };
    await saveUserProfile(newProfile);
    onUpdate(newProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12 px-6 space-y-8 pb-24">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h2>
          <p className="text-gray-500 font-medium italic">"It's about Identity." - Tayab Nafis (10xTN)</p>
        </div>

        {/* Identity Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center space-x-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
            <User className="w-4 h-4" />
            <span>Your Identity</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400 uppercase">Full Name</label>
              <input
                type="text"
                disabled
                value={fullName}
                className="w-full p-4 bg-gray-100 border-2 border-transparent rounded-2xl outline-none transition-all font-semibold text-gray-500 cursor-not-allowed"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Name cannot be changed</p>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400 uppercase">Current Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-semibold"
              >
                <option value="">None Selected</option>
                <option value="Student">Student (SSC/HSC/Uni)</option>
                <option value="Developer">Software Developer</option>
                <option value="Entrepreneur">Entrepreneur</option>
                <option value="Creator">Content Creator</option>
                <option value="Hobbyist">Hobbyist</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase">Identity Key (Password)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-semibold"
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

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase">Primary Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What are you dominating right now?"
              className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-semibold"
            />
          </div>
        </section>

        {/* Personalization Section */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center space-x-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
            <BrainCircuit className="w-4 h-4" />
            <span>Personalization</span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase">Custom AI Instructions</label>
            <p className="text-sm text-gray-500 mb-2">Tell Cereon how to behave. Example: "Explain things simply, assume I am 15, and always give a coding example."</p>
            <textarea
              value={personalization}
              onChange={(e) => setPersonalization(e.target.value)}
              placeholder="Enter your preferences here..."
              className="w-full h-40 p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-semibold resize-none"
            />
          </div>
        </section>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">All settings are stored locally on your device.</p>
          <button
            onClick={handleSave}
            disabled={!fullName.trim() || !password.trim()}
            className={`px-8 py-4 rounded-2xl font-black flex items-center space-x-2 transition-all shadow-xl ${
              saved 
                ? 'bg-green-500 text-white shadow-green-100' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
          >
            {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span>{saved ? 'Saved!' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
