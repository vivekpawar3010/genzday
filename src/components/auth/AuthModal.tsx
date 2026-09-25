import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
  onEmailSignUp: (email: string, pass: string, name: string, scopeCode?: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setLoading(false);
          return;
        }
        await onEmailSignUp(email, password, name, workspaceCode);
      } else {
        await onEmailSignIn(email, password);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border-white/20 relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-[var(--text-main)]">
            {isSignUp ? 'Create Cloud Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {isSignUp 
              ? 'Backup your routines & tasks across all devices' 
              : 'Sign in to access your cloud-synced workspace'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* 1-Click Google Sign In */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-lg border border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-[var(--border)] w-full"></div>
          <span className="bg-[var(--card-bg)] px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 absolute">
            or continue with email
          </span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5 opacity-70">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  required
                  placeholder="Vivek Pawar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass pl-10 pr-4 py-3 rounded-xl text-xs text-[var(--text-main)] border border-white/10 outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5 opacity-70">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass pl-10 pr-4 py-3 rounded-xl text-xs text-[var(--text-main)] border border-white/10 outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5 opacity-70">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass pl-10 pr-4 py-3 rounded-xl text-xs text-[var(--text-main)] border border-white/10 outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5 opacity-70">
                Workspace Code <span className="text-[8px] opacity-50 font-normal">(Optional)</span>
              </label>
              <input 
                type="text"
                placeholder="e.g. VIP-TEAM-2026"
                value={workspaceCode}
                onChange={(e) => setWorkspaceCode(e.target.value)}
                className="w-full glass px-4 py-3 rounded-xl text-xs text-[var(--text-main)] border border-white/10 outline-none focus:border-[var(--accent)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : isSignUp ? 'Register & Request Access' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
            className="text-[10px] font-bold text-[var(--accent)] hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
