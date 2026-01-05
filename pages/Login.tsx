
import React, { useState, useEffect } from 'react';
import * as firebaseAuth from "firebase/auth";
import { auth } from '../services/firebase';
import { syncUserProfile } from '../services/userService';
import { APP_NAME } from '../constants';
import { Mail, Lock, User as UserIcon, Camera, ChevronRight, AlertCircle, Shield, Zap } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Clear errors when switching modes
  useEffect(() => {
    setError('');
  }, [mode]);

  const handleAuthComplete = async (firebaseUser: any) => {
    try {
        // Attempt Firestore sync but catch failures immediately
        await syncUserProfile(firebaseUser);
        onLoginSuccess(firebaseUser);
    } catch (err) {
        console.warn("Firestore sync failed during login. Continuing with auth user only.", err);
        // Fallback: Proceed with basic auth user even if profile sync fails
        onLoginSuccess(firebaseUser);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    // Simulate network delay for realism
    setTimeout(() => {
      const mockUser = {
        uid: 'demo_guardian_' + Date.now(),
        email: 'guardian@rakshak.ai',
        displayName: 'Demo Guardian',
        photoURL: '',
        isAnonymous: true,
        isOfflineMode: true
      };
      handleAuthComplete(mockUser);
    }, 800);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'LOGIN') {
        try {
          const result = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
          handleAuthComplete(result.user);
        } catch (err: any) {
          // Log only unexpected errors to keep console clean
          if (err.code !== 'auth/invalid-credential' && err.code !== 'auth/user-not-found' && err.code !== 'auth/wrong-password') {
             console.error("Login error", err);
          }

          if (
            err.code === 'auth/invalid-credential' || 
            err.code === 'auth/user-not-found' || 
            err.code === 'auth/wrong-password'
          ) {
            setError("Password or Email Incorrect");
          } else if (err.code === 'auth/invalid-email') {
            setError("Invalid email format.");
          } else if (err.code === 'auth/too-many-requests') {
             setError("Too many attempts. Reset password or try later.");
          } else {
            setError(err.message || "Login failed");
          }
          setLoading(false);
        }
      } else {
        // Registration Flow
        if (password !== repeatPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        try {
          const result = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
          
          // Try to update the display name immediately on the Auth object
          if (fullName) {
             await firebaseAuth.updateProfile(result.user, {
               displayName: fullName,
               photoURL: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
             }).catch(e => console.log("Profile update warning", e));
          }

          handleAuthComplete(result.user);
        } catch (err: any) {
          console.error("Signup error", err);
          if (err.code === 'auth/email-already-in-use') {
            setError("User already exists. Sign in?");
          } else if (err.code === 'auth/weak-password') {
             setError("Password should be at least 6 characters.");
          } else if (err.code === 'auth/operation-not-allowed') {
             setError("Email/Password auth not enabled in Firebase Console.");
          } else {
            setError(err.message || "Registration failed");
          }
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new firebaseAuth.GoogleAuthProvider();
      const result = await firebaseAuth.signInWithPopup(auth, provider);
      handleAuthComplete(result.user);
    } catch (err: any) {
      console.error("Google Login failed", err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled.");
      } else if (err.code === 'auth/unauthorized-domain') {
        // Specific feedback: Tell the user exactly which domain is being blocked
        setError(`Domain (${window.location.hostname}) is not authorized. Add it in Firebase Console > Auth > Settings.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is disabled in Firebase Console.");
      } else {
        setError(err.message || "Google Sign-In failed.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Logo Area */}
      <div className="mb-8 relative z-10 transition-all duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(220,38,38,0.4)] mx-auto border-2 border-slate-800 rotate-3">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">{APP_NAME}</h1>
          <div className="py-1 px-4 bg-blue-500/10 border border-blue-500/20 rounded-full inline-block">
             <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest italic">
               WHEN SECONDS MATTER, COMMUNITY RESPONDS
             </span>
          </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 w-full max-w-sm shadow-2xl relative z-10">
        
        <form onSubmit={handleAuthAction} className="space-y-4">
          
          {mode === 'SIGNUP' && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="relative group">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="url" 
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Profile Photo URL (Optional)"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {mode === 'SIGNUP' && (
            <div className="relative group animate-in slide-in-from-top-2 duration-300">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="Repeat Password"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-[10px] flex items-center gap-2 animate-in shake duration-300 text-left">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{mode === 'LOGIN' ? 'Login' : 'Join Grid'}</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
           <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-colors border border-white shadow-lg text-xs"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                <span>Continue with Google</span>
            </button>
        </div>

        <div className="mt-8 text-xs">
          <span className="text-slate-500">{mode === 'LOGIN' ? "New to Rakshak?" : "Have an account?"}</span>
          <button 
            onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
            className="ml-2 text-blue-500 font-black hover:text-blue-400 transition-colors uppercase tracking-tight"
          >
            {mode === 'LOGIN' ? 'Register' : 'Login'}
          </button>
        </div>
      </div>
      
      {/* Demo Mode Fallback for judges/testing */}
      <button 
        onClick={handleDemoLogin}
        className="mt-8 text-slate-700 text-[10px] uppercase tracking-widest hover:text-blue-500 transition-colors flex items-center gap-2"
      >
        <Zap size={10} />
        Enter Demo Mode
      </button>

      <div className="mt-8 text-slate-800 text-[10px] uppercase tracking-[0.4em] font-black flex items-center gap-2">
        <Shield size={10} />
        Secure: AES-256
      </div>
    </div>
  );
};
