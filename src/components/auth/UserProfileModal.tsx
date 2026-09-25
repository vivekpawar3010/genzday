import React, { useState } from 'react';
import { X, Cloud, CheckCircle, Clock, ShieldCheck, LogOut, RefreshCw, Crown } from 'lucide-react';
import { UserProfile } from '../../types/index';
import { backupLocalDataToCloud } from '../../services/cloudSync';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  isAdmin: boolean;
  onOpenAdminConsole?: () => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  isAdmin,
  onOpenAdminConsole,
  onLogout,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await backupLocalDataToCloud(user);
      if (res) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } finally {
      setSyncing(false);
    }
  };

  const isPending = user.status === 'pending';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border-white/20 relative text-left">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-lg shrink-0 bg-black/20 flex items-center justify-center">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-black text-[var(--accent)]">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black tracking-tight text-[var(--text-main)] truncate">
              {user.displayName}
            </h3>
            <p className="text-xs text-[var(--text-muted)] truncate opacity-80 mb-1.5">
              {user.email}
            </p>
            {isPending ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="w-2.5 h-2.5" />
                Pending Verification
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle className="w-2.5 h-2.5" />
                Cloud Synced
              </span>
            )}
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-main)]">Cloud Sync Engine</p>
                <p className="text-[9px] text-[var(--text-muted)]">
                  {isPending 
                    ? 'Data stored in local cache until approved.' 
                    : 'Real-time multi-device sync active.'}
                </p>
              </div>
            </div>
            {!isPending && (
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-main)] transition-all"
                title="Backup Local Data to Cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {syncSuccess && (
            <p className="text-[10px] font-bold text-emerald-500 text-center animate-fadeIn">
              ✓ Local routines and tasks successfully backed up to cloud!
            </p>
          )}

          {isPending && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-600 dark:text-amber-300 leading-relaxed">
              Your registration is under review by the workspace manager. All your habits, tasks, and routines remain 100% saved locally on this browser.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          {isAdmin && onOpenAdminConsole && (
            <button
              onClick={() => {
                onClose();
                onOpenAdminConsole();
              }}
              className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                user.email?.toLowerCase().includes('vivek')
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                  : 'bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/20'
              }`}
            >
              {user.email?.toLowerCase().includes('vivek') ? (
                <>
                  <Crown className="w-4 h-4" />
                  Open Command Hub (/king)
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Open Workspace Admin Console
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
