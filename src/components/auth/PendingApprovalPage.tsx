import React, { useState } from 'react';
import { Clock, RefreshCw, CheckCircle, ArrowRight, LogOut, ShieldCheck, Tag } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { UserProfile } from '../../types/index';

interface PendingApprovalPageProps {
  user: UserProfile;
  onRefreshUser: () => Promise<void>;
  onContinueLocal: () => void;
  onLogout: () => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({
  user,
  onRefreshUser,
  onContinueLocal,
  onLogout,
}) => {
  const [adminCode, setAdminCode] = useState(user.assignedScopeTag || '');
  const [updatingCode, setUpdatingCode] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setErrorMsg(null);
    try {
      if (!isFirebaseConfigured) {
        // In demo mode, check local storage
        const saved = localStorage.getItem('vtm_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.status === 'active') {
            await onRefreshUser();
            return;
          }
        }
        await new Promise(r => setTimeout(r, 600));
        setErrorMsg('Still pending confirmation. Please ask your Admin to approve your request.');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const fresh = snap.data() as UserProfile;
        if (fresh.status === 'active') {
          await onRefreshUser();
        } else {
          setErrorMsg('Your access request is still pending approval by an administrator.');
        }
      }
    } catch (err) {
      console.error('Check status error:', err);
      setErrorMsg('Failed to check status. Please check your internet connection.');
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim()) return;
    setUpdatingCode(true);
    setCodeSuccess(false);

    try {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'users', user.uid), {
          assignedScopeTag: adminCode.trim().toLowerCase()
        });
      }
      user.assignedScopeTag = adminCode.trim().toLowerCase();
      localStorage.setItem('vtm_user_profile', JSON.stringify(user));
      setCodeSuccess(true);
      setTimeout(() => setCodeSuccess(false), 3000);
    } catch (err) {
      console.error('Update code error:', err);
    } finally {
      setUpdatingCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="glass p-8 sm:p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl border-white/20 text-center relative">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-2xl font-black tracking-tight text-[var(--text-main)] mb-1">
          Access Request Pending
        </h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto mb-6">
          Your cloud sync account has been requested and is awaiting confirmation from an administrator.
        </p>

        {/* User Badge */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 text-left mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--accent)] shrink-0 bg-black/20 flex items-center justify-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-black text-[var(--accent)]">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--text-main)] truncate">{user.displayName}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 mt-1">
              <Clock className="w-2.5 h-2.5" /> Waiting for approval
            </span>
          </div>
        </div>

        {/* Admin / Workspace Code Input */}
        <form onSubmit={handleUpdateCode} className="mb-6 text-left">
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1.5 opacity-70">
            Assigned Admin / Referral Code
          </label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Tag className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Enter Admin code or email (optional)..."
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full glass pl-8 pr-3 py-2.5 rounded-xl text-xs text-[var(--text-main)] border border-white/10 outline-none focus:border-[var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={updatingCode}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[var(--text-main)] transition-colors shrink-0"
            >
              {updatingCode ? 'Saving...' : 'Link'}
            </button>
          </div>
          {codeSuccess && (
            <p className="text-[10px] text-emerald-500 font-bold mt-1.5 animate-fadeIn">
              ✓ Admin code successfully linked to your request!
            </p>
          )}
        </form>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Check Status Button */}
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="w-full py-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] mb-3"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking Status...' : 'Check Approval Status'}
        </button>

        {/* Alternate Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] text-xs">
          <button
            onClick={onContinueLocal}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold flex items-center gap-1 transition-colors"
          >
            Continue in Local Mode
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onLogout}
            className="text-red-500 hover:text-red-600 font-bold flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
