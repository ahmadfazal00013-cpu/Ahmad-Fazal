
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { validateLocation } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gender: 'Male',
    dob: '',
    location: '',
    onboarded: false
  });
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile.name || !profile.dob || !profile.location) {
      setError("Please fill in all fields.");
      return;
    }

    // DOB Validation (1950 onwards)
    const birthDate = new Date(profile.dob);
    const birthYear = birthDate.getFullYear();
    if (birthYear < 1950) {
      setError("Only individuals born in 1950 or later are permitted to use this platform.");
      return;
    }

    setIsValidating(true);
    
    // Location Validation via AI
    const isValidLocation = await validateLocation(profile.location);
    
    if (!isValidLocation) {
      setError("Please enter a valid, real city and country (e.g., London, UK).");
      setIsValidating(false);
      return;
    }

    setIsValidating(false);
    onComplete({ ...profile, onboarded: true });
  };

  const handleSkip = () => {
    onComplete({
      name: 'Guest',
      gender: 'Male',
      dob: '2000-01-01',
      location: 'Earth',
      onboarded: true
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6">
      <div className="fixed top-20 -left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-20 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
      
      <div className="glass-panel-dark p-8 rounded-[3rem] border border-white/10 w-full max-w-md animate-fade-in relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <i className="fa-solid fa-kaaba text-2xl text-white"></i>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">PLWI</h1>
          <p className="text-white/40 font-medium">Proper Life with Islam</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5 ml-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="e.g. Muhammad"
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5 ml-1">Gender</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none appearance-none"
                value={profile.gender}
                onChange={e => setProfile({...profile, gender: e.target.value as any})}
              >
                <option value="Male" className="bg-slate-900">Male</option>
                <option value="Female" className="bg-slate-900">Female</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5 ml-1">Date of Birth</label>
              <input 
                type="date" 
                required
                min="1950-01-01"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={profile.dob}
                onChange={e => setProfile({...profile, dob: e.target.value})}
              />
              <p className="text-[8px] text-white/20 mt-1 ml-1 font-bold">Minimum year: 1950</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1.5 ml-1">Location</label>
            <input 
              type="text" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="e.g. Madinah, Saudi Arabia"
              value={profile.location}
              onChange={e => setProfile({...profile, location: e.target.value})}
            />
            <p className="text-[8px] text-white/20 mt-1 ml-1 font-bold italic">Verification required (City, Country)</p>
          </div>

          <button 
            type="submit"
            disabled={isValidating}
            className="w-full bg-white text-black py-4 rounded-3xl font-black text-sm shadow-xl mt-6 active:scale-95 transition-all hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                Verifying Identity...
              </>
            ) : (
              'Launch Identity'
            )}
          </button>

          <button 
            type="button"
            onClick={handleSkip}
            className="w-full text-white/40 text-[10px] font-bold uppercase tracking-widest py-2 hover:text-white transition-colors"
          >
            Skip Setup
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
