import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Users, 
  Search, 
  Check, 
  Ban, 
  X, 
  RefreshCw, 
  ArrowRightLeft, 
  UserPlus, 
  Filter, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  ShieldAlert, 
  Mail, 
  UserX,
  Send,
  CheckCircle,
  EyeOff,
  Lock
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { UserProfile } from '../../types/index';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isMaster: boolean;
  isAdmin: boolean;
  onOpenAuth?: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isMaster,
  isAdmin,
  onOpenAuth,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAdminFilter, setSelectedAdminFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  
  // Navigation Tabs
  // For Super Admin: 'users' | 'admins' | 'escalations'
  // For Sub-Admin: 'my-users' | 'request-admin'
  const [activeTab, setActiveTab] = useState<string>(isMaster ? 'users' : 'my-users');

  // Direct Admin Creation (Super Admin)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [directAdminStatus, setDirectAdminStatus] = useState<string | null>(null);

  // Sub-Admin Escalation Request Form
  const [requestCandidateEmail, setRequestCandidateEmail] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [escalationSubmitStatus, setEscalationSubmitStatus] = useState<string | null>(null);

  // Reassignment Modal state (Super Admin)
  const [reassignTarget, setReassignTarget] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      // Mock global dataset for development & offline mode
      const mockUsers: UserProfile[] = [
        {
          uid: 'admin-1',
          email: 'vikram.admin@example.com',
          displayName: 'Vikram Sharma',
          role: 'admin',
          status: 'active',
          assignedScopeId: null,
          assignedScopeTag: 'root',
          createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
          verifiedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
          hasMigratedLocalData: true
        },
        {
          uid: 'admin-2',
          email: 'priya.lead@example.com',
          displayName: 'Priya Patel',
          role: 'admin',
          status: 'active',
          assignedScopeId: null,
          assignedScopeTag: 'root',
          createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
          verifiedAt: new Date(Date.now() - 86400000 * 18).toISOString(),
          hasMigratedLocalData: true
        },
        {
          uid: 'user-1',
          email: 'rahul.k@example.com',
          displayName: 'Rahul Kumar',
          role: 'user',
          status: 'active',
          assignedScopeId: 'admin-1',
          assignedScopeTag: 'vikram.admin@example.com',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          verifiedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
          hasMigratedLocalData: true
        },
        {
          uid: 'user-2',
          email: 'neha.v@example.com',
          displayName: 'Neha Verma',
          role: 'user',
          status: 'pending',
          assignedScopeId: 'admin-1',
          assignedScopeTag: 'vikram.admin@example.com',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          hasMigratedLocalData: false
        },
        {
          uid: 'user-3',
          email: 'rohan.d@example.com',
          displayName: 'Rohan Deshmukh',
          role: 'user',
          status: 'pending',
          assignedScopeId: 'admin-2',
          assignedScopeTag: 'priya.lead@example.com',
          createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
          hasMigratedLocalData: false
        },
        {
          uid: 'user-4',
          email: 'ananya.s@example.com',
          displayName: 'Ananya Sen',
          role: 'user',
          status: 'active',
          assignedScopeId: 'admin-1',
          assignedScopeTag: 'vikram.admin@example.com',
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
          verifiedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          hasMigratedLocalData: true,
          adminRequestStatus: 'pending',
          adminRequestedBy: 'vikram.admin@example.com',
          adminRequestReason: 'Leading our new design routine squad and needs management tools.',
          adminRequestedAt: new Date(Date.now() - 3600000 * 6).toISOString()
        }
      ];
      setUsers(mockUsers);
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach(d => list.push(d.data() as UserProfile));
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users in Admin Console:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setActiveTab(isMaster ? 'users' : 'my-users');
    }
  }, [isOpen, fetchUsers, isMaster]);

  // List of all admins for filtering and attribution
  const adminList = useMemo(() => {
    return users.filter(u => u.role === 'admin');
  }, [users]);

  // All Admin escalation requests (requested by sub-admins)
  const pendingAdminRequests = useMemo(() => {
    return users.filter(u => u.adminRequestStatus === 'pending');
  }, [users]);

  // Filtered dataset depending on user role & active tab
  const displayedUsers = useMemo(() => {
    let list = users;

    // Sub-admins ONLY see users in their assigned scope
    if (!isMaster) {
      const currentUid = currentUser?.uid;
      const currentEmail = (currentUser?.email || '').toLowerCase();
      list = list.filter(u => 
        (currentUid && u.assignedScopeId === currentUid) || 
        (currentEmail && Boolean(u.assignedScopeTag) && u.assignedScopeTag!.toLowerCase() === currentEmail)
      );
    } else {
      // Super admin can filter by specific admin
      if (selectedAdminFilter !== 'all') {
        if (selectedAdminFilter === 'unassigned') {
          list = list.filter(u => !u.assignedScopeId && !u.assignedScopeTag);
        } else {
          list = list.filter(u => 
            u.assignedScopeId === selectedAdminFilter || 
            u.assignedScopeTag === selectedAdminFilter
          );
        }
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(u => u.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => 
        u.displayName?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) ||
        u.assignedScopeTag?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, isMaster, currentUser?.uid, currentUser?.email, selectedAdminFilter, statusFilter, search]);

  // 1. APPROVE / PASS USER (Both Sub-Admin and Super Admin can pass)
  const handleApproveUser = async (userId: string) => {
    const updated = users.map(u => {
      if (u.uid === userId) {
        return {
          ...u,
          status: 'active' as const,
          verifiedAt: new Date().toISOString(),
          // If sub-admin approved, ensure assignment
          assignedScopeId: isMaster ? u.assignedScopeId : (currentUser?.uid || null),
          assignedScopeTag: isMaster ? u.assignedScopeTag : (currentUser?.email || 'admin')
        };
      }
      return u;
    });
    setUsers(updated);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: 'active',
          verifiedAt: new Date().toISOString(),
          ...(isMaster ? {} : {
            assignedScopeId: currentUser?.uid || null,
            assignedScopeTag: currentUser?.email || 'admin'
          })
        });
      } catch (err) {
        console.error('Failed to approve user:', err);
      }
    }
  };

  // 2. CANCEL / SUSPEND USER (Super Admin or Sub-Admin can cancel user access)
  const handleCancelUser = async (userId: string) => {
    setUsers(users.map(u => u.uid === userId ? { ...u, status: 'suspended' } : u));
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), { status: 'suspended' });
      } catch (err) {
        console.error('Failed to cancel user:', err);
      }
    }
  };

  // 3. REACTIVATE USER
  const handleReactivateUser = async (userId: string) => {
    setUsers(users.map(u => u.uid === userId ? { ...u, status: 'active' } : u));
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), { status: 'active' });
      } catch (err) {
        console.error('Failed to reactivate user:', err);
      }
    }
  };

  // 4. SUPER ADMIN: CREATE / PROMOTE NEW ADMIN DIRECTLY
  const handleDirectPromoteAdmin = async (targetEmailOrUid: string) => {
    const clean = targetEmailOrUid.trim().toLowerCase();
    if (!clean) return;

    let target = users.find(u => u.email?.toLowerCase() === clean || u.uid === clean);

    if (target) {
      setUsers(users.map(u => u.uid === target!.uid ? { 
        ...u, 
        role: 'admin', 
        status: 'active', 
        adminRequestStatus: 'none',
        verifiedAt: new Date().toISOString()
      } : u));

      if (isFirebaseConfigured) {
        try {
          await updateDoc(doc(db, 'users', target.uid), {
            role: 'admin',
            status: 'active',
            adminRequestStatus: 'none',
            verifiedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Direct promote admin failed:', err);
        }
      }
      setDirectAdminStatus(`Successfully promoted ${target.displayName || target.email} to Admin!`);
      setNewAdminEmail('');
      setTimeout(() => setDirectAdminStatus(null), 4000);
    } else {
      setDirectAdminStatus(`User with email "${clean}" was not found. Have them sign up first.`);
      setTimeout(() => setDirectAdminStatus(null), 5000);
    }
  };

  // 5. SUPER ADMIN: CANCEL / DEMOTE ANY ADMIN
  const handleCancelAdmin = async (adminId: string) => {
    const target = users.find(u => u.uid === adminId);
    if (!target) return;
    if (target.email?.toLowerCase().includes('vivek')) {
      alert('Cannot revoke primary Root Super Admin.');
      return;
    }

    if (!confirm(`Are you sure you want to cancel admin privileges for ${target.displayName || target.email}? They will be demoted to standard user.`)) {
      return;
    }

    setUsers(users.map(u => u.uid === adminId ? { ...u, role: 'user' } : u));
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', adminId), { role: 'user' });
      } catch (err) {
        console.error('Failed to demote admin:', err);
      }
    }
  };

  // 6. SUPER ADMIN: APPROVE / PASS ADMIN ESCALATION REQUEST
  const handlePassAdminRequest = async (userId: string) => {
    setUsers(users.map(u => u.uid === userId ? {
      ...u,
      role: 'admin',
      status: 'active',
      adminRequestStatus: 'none',
      verifiedAt: new Date().toISOString()
    } : u));

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          role: 'admin',
          status: 'active',
          adminRequestStatus: 'none',
          verifiedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to pass admin escalation request:', err);
      }
    }
  };

  // 7. SUPER ADMIN: REJECT ADMIN ESCALATION REQUEST
  const handleRejectAdminRequest = async (userId: string) => {
    setUsers(users.map(u => u.uid === userId ? { ...u, adminRequestStatus: 'rejected' } : u));
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', userId), { adminRequestStatus: 'rejected' });
      } catch (err) {
        console.error('Failed to reject admin request:', err);
      }
    }
  };

  // 8. SUB-ADMIN: SUBMIT ADMIN PROMOTION REQUEST TO DEVELOPER
  const handleSubAdminSubmitEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestCandidateEmail.trim()) return;

    const candidate = users.find(u => 
      u.email.toLowerCase() === requestCandidateEmail.trim().toLowerCase()
    );

    if (!candidate) {
      setEscalationSubmitStatus('Candidate not found in current registered records. Please make sure they registered.');
      setTimeout(() => setEscalationSubmitStatus(null), 5000);
      return;
    }

    const updatedCandidate: UserProfile = {
      ...candidate,
      adminRequestStatus: 'pending',
      adminRequestedBy: currentUser?.email || 'admin',
      adminRequestReason: requestReason.trim() || 'Sub-admin requested team management authority',
      adminRequestedAt: new Date().toISOString()
    };

    setUsers(users.map(u => u.uid === candidate.uid ? updatedCandidate : u));

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', candidate.uid), {
          adminRequestStatus: 'pending',
          adminRequestedBy: currentUser?.email || 'admin',
          adminRequestReason: requestReason.trim() || 'Sub-admin requested team management authority',
          adminRequestedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to submit admin request to developer:', err);
      }
    }

    setEscalationSubmitStatus('✓ Admin nomination sent to System Developer for security approval!');
    setRequestCandidateEmail('');
    setRequestReason('');
    setTimeout(() => setEscalationSubmitStatus(null), 5000);
  };

  // 9. SUPER ADMIN: REASSIGN USER TO ANOTHER ADMIN
  const handleReassign = async (newAdminTag: string, newAdminId?: string) => {
    if (!reassignTarget) return;

    setUsers(users.map(u => u.uid === reassignTarget.uid ? {
      ...u,
      assignedScopeId: newAdminId || null,
      assignedScopeTag: newAdminTag
    } : u));

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'users', reassignTarget.uid), {
          assignedScopeId: newAdminId || null,
          assignedScopeTag: newAdminTag
        });
      } catch (err) {
        console.error('Reassignment failed:', err);
      }
    }

    setReassignTarget(null);
  };

  if (!isOpen) return null;

  if (!currentUser || (!isAdmin && !isMaster)) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={onClose} />
        <div className="relative w-full max-w-md glass p-8 rounded-3xl border border-white/20 text-center space-y-4 bg-[#14141c]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">Administrator Credentials Required</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            This management console is restricted to workspace administrators. Please log in with authorized credentials.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
            >
              Cancel
            </button>
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-black text-xs font-black transition-all shadow-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Expansive Bigger Admin Panel Container */}
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[900px] glass border border-white/20 dark:border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-scaleIn bg-gradient-to-br from-[#121218]/95 via-[#181822]/95 to-[#0f0f14]/98">
        
        {/* TOP HEADER */}
        <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border ${
              isMaster 
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {isMaster ? <Crown className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isMaster ? 'Super Admin Command Hub' : 'Workspace Admin Console'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isMaster 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isMaster ? 'Root Authority' : 'Assigned Admin'}
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                {isMaster 
                  ? 'Manage all admins, approve/cancel users, process developer escalation requests' 
                  : 'Manage team approvals and submit administrative role requests to developer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all flex items-center gap-2 text-xs font-bold"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP KPI CARDS (Bigger Panel Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 sm:px-8 border-b border-white/10 bg-white/[0.01]">
          {isMaster ? (
            <>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-black text-white mt-1">{users.length}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">Active Admins</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 mt-1">{adminList.length}</p>
              </div>

              <div 
                onClick={() => { setActiveTab('users'); setStatusFilter('pending'); }}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">Pending Users</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('escalations')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pendingAdminRequests.length > 0 
                    ? 'bg-purple-500/15 border-purple-500/40 hover:bg-purple-500/20 animate-pulse' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">Admin Requests</span>
                  <UserPlus className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-purple-400 mt-1">{pendingAdminRequests.length}</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">Assigned Members</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-black text-white mt-1">
                  {users.filter(u => (currentUser?.uid && u.assignedScopeId === currentUser.uid) || (currentUser?.email && u.assignedScopeTag?.toLowerCase() === currentUser.email.toLowerCase())).length}
                </p>
              </div>

              <div 
                onClick={() => setStatusFilter('pending')}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">Pending Approval</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {users.filter(u => ((currentUser?.uid && u.assignedScopeId === currentUser.uid) || (currentUser?.email && u.assignedScopeTag?.toLowerCase() === currentUser.email.toLowerCase())) && u.status === 'pending').length}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Active Members</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {users.filter(u => ((currentUser?.uid && u.assignedScopeId === currentUser.uid) || (currentUser?.email && u.assignedScopeTag?.toLowerCase() === currentUser.email.toLowerCase())) && u.status === 'active').length}
                </p>
              </div>

              <div 
                onClick={() => setActiveTab('request-admin')}
                className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">Request Admin</span>
                  <Send className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-bold text-purple-300 mt-2">To Developer →</p>
              </div>
            </>
          )}
        </div>

        {/* TABS BAR */}
        <div className="flex items-center gap-3 px-6 sm:px-8 pt-4 pb-2 border-b border-white/10 bg-white/[0.01]">
          {isMaster ? (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-3 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                All Users & Approvals ({users.length})
              </button>

              <button
                onClick={() => setActiveTab('admins')}
                className={`pb-3 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'admins'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Admins Management ({adminList.length})
              </button>

              <button
                onClick={() => setActiveTab('escalations')}
                className={`pb-3 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 relative ${
                  activeTab === 'escalations'
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Admin Requests ({pendingAdminRequests.length})
                {pendingAdminRequests.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('my-users')}
                className={`pb-3 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'my-users'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                My Team Members
              </button>

              <button
                onClick={() => setActiveTab('request-admin')}
                className={`pb-3 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'request-admin'
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Request Admin to Developer
              </button>
            </>
          )}
        </div>

        {/* TAB BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* TAB 1: USERS DIRECTORY (FOR SUPER ADMIN OR SUB-ADMIN) */}
          {(activeTab === 'users' || activeTab === 'my-users') && (
            <div className="space-y-5">
              {/* FILTERS TOOLBAR */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email or admin..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                  {/* Super Admin filter by Admin */}
                  {isMaster && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                      <Filter className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-[10px] font-black text-white/50 uppercase">Admin:</span>
                      <select
                        value={selectedAdminFilter}
                        onChange={(e) => setSelectedAdminFilter(e.target.value)}
                        className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-[#1a1a24] text-white">All Admins</option>
                        <option value="unassigned" className="bg-[#1a1a24] text-white">Unassigned / Direct</option>
                        {adminList.map(a => (
                          <option key={a.uid} value={a.email} className="bg-[#1a1a24] text-white">
                            {a.displayName || a.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Filter by Status */}
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                    {(['all', 'pending', 'active', 'suspended'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          statusFilter === s
                            ? 'bg-white/20 text-white'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* USERS LIST / TABLE */}
              {loading ? (
                <div className="py-20 text-center text-white/50 text-xs font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading accounts...
                </div>
              ) : displayedUsers.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-2xl">
                  <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white/70">No matching accounts found</p>
                  <p className="text-xs text-white/40 mt-1">Adjust your search query or status filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {displayedUsers.map(u => {
                    const isUserMaster = u.email?.toLowerCase().includes('vivek');
                    const isPending = u.status === 'pending';
                    const isSuspended = u.status === 'suspended';

                    return (
                      <div 
                        key={u.uid}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          isPending
                            ? 'bg-amber-500/[0.06] border-amber-500/30'
                            : isSuspended
                            ? 'bg-red-500/[0.04] border-red-500/20 opacity-70'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-black text-sm text-white shrink-0 overflow-hidden">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white truncate">{u.displayName || 'Unknown User'}</span>
                              
                              {/* Role Badge */}
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              }`}>
                                {u.role}
                              </span>

                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                isPending
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                  : isSuspended
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}>
                                {u.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-white/50 mt-1 flex-wrap">
                              <span>{u.email}</span>
                              <span>•</span>
                              <span>Registered: {new Date(u.createdAt).toLocaleDateString()}</span>
                              
                              {/* Which Admin is this user under? */}
                              {isMaster && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-300/80 font-semibold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                                    Under Admin: {u.assignedScopeTag || 'Direct / Root'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS: Pass (Approve), Cancel (Suspend), Reassign, Promote */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                          {/* 1. APPROVE / PASS USER */}
                          {isPending && (
                            <button
                              onClick={() => handleApproveUser(u.uid)}
                              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                              title="Approve & Pass User"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Pass & Confirm
                            </button>
                          )}

                          {/* 2. CANCEL / SUSPEND USER */}
                          {!isUserMaster && !isSuspended && (
                            <button
                              onClick={() => handleCancelUser(u.uid)}
                              className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                              title="Cancel / Suspend Access"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Cancel Access
                            </button>
                          )}

                          {/* REACTIVATE IF SUSPENDED */}
                          {isSuspended && (
                            <button
                              onClick={() => handleReactivateUser(u.uid)}
                              className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Reactivate
                            </button>
                          )}

                          {/* 3. SUPER ADMIN ONLY: REASSIGN TO ANOTHER ADMIN */}
                          {isMaster && !isUserMaster && (
                            <button
                              onClick={() => setReassignTarget(u)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition-all"
                              title="Reassign to another Admin"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 4. SUPER ADMIN ONLY: DIRECT PROMOTE TO ADMIN */}
                          {isMaster && u.role !== 'admin' && (
                            <button
                              onClick={() => handleDirectPromoteAdmin(u.uid)}
                              className="py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                              title="Promote directly to Admin"
                            >
                              <Crown className="w-3 h-3" />
                              Make Admin
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADMIN MANAGEMENT & DIRECT CREATION (SUPER ADMIN ONLY) */}
          {isMaster && activeTab === 'admins' && (
            <div className="space-y-6">
              {/* DIRECT ADMIN CREATION FORM */}
              <div className="p-6 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">Create / Grant New Admin Directly</h3>
                </div>
                <p className="text-xs text-white/60 mb-4">
                  As Super Admin, you can directly create new admins without waiting. Enter an existing user&apos;s email to promote them to Admin.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter user email (e.g. manager@example.com)..."
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => handleDirectPromoteAdmin(newAdminEmail)}
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4" />
                    Grant Admin Privileges
                  </button>
                </div>

                {directAdminStatus && (
                  <p className="text-xs font-bold text-amber-300 mt-3 animate-fadeIn">
                    {directAdminStatus}
                  </p>
                )}
              </div>

              {/* LIST OF ALL CURRENT ADMINS */}
              <div>
                <h4 className="text-xs font-black text-white/60 uppercase tracking-wider mb-3">
                  All Active Administrators ({adminList.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminList.map(adm => {
                    const isRoot = adm.email?.toLowerCase().includes('vivek');
                    const membersCount = users.filter(u => 
                      u.assignedScopeId === adm.uid || u.assignedScopeTag === adm.email
                    ).length;

                    return (
                      <div 
                        key={adm.uid}
                        className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-300 text-sm">
                            <Crown className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{adm.displayName || adm.email}</span>
                              {isRoot && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                                  Root Master
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50">{adm.email}</p>
                            <p className="text-[10px] text-amber-400/90 font-bold mt-1">
                              Managing {membersCount} assigned members
                            </p>
                          </div>
                        </div>

                        {/* CANCEL / DEMOTE ADMIN */}
                        {!isRoot && (
                          <button
                            onClick={() => handleCancelAdmin(adm.uid)}
                            className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                            title="Demote this admin to regular user"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Cancel Admin
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN ESCALATION REQUESTS (SUPER ADMIN VIEW) */}
          {isMaster && activeTab === 'escalations' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-400" />
                    Pending Admin Requests from Sub-Admins
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Sub-admins requested developer authority for these users. Review and approve or cancel.
                  </p>
                </div>
              </div>

              {pendingAdminRequests.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-white/80">No pending admin escalation requests</p>
                  <p className="text-xs text-white/40 mt-1">When any sub-admin requests a new admin, it will appear here for your approval.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAdminRequests.map(cand => (
                    <div 
                      key={cand.uid}
                      className="p-5 rounded-2xl bg-purple-500/[0.06] border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white">{cand.displayName || cand.email}</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase tracking-wider">
                            Admin Candidate
                          </span>
                        </div>
                        <p className="text-xs text-white/60">{cand.email}</p>
                        
                        <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 space-y-1">
                          <p>
                            <strong className="text-purple-300">Requested By Admin:</strong> {cand.adminRequestedBy}
                          </p>
                          <p>
                            <strong className="text-white/60">Reason:</strong> {cand.adminRequestReason || 'Not specified'}
                          </p>
                          {cand.adminRequestedAt && (
                            <p className="text-[10px] text-white/40">
                              Submitted: {new Date(cand.adminRequestedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handlePassAdminRequest(cand.uid)}
                          className="py-2 px-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          Approve & Make Admin
                        </button>
                        <button
                          onClick={() => handleRejectAdminRequest(cand.uid)}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SUB-ADMIN: REQUEST NEW ADMIN TO DEVELOPER */}
          {!isMaster && activeTab === 'request-admin' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-6 rounded-2xl bg-purple-500/[0.08] border border-purple-500/25">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-black text-white">Nominate New Admin to Developer</h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-6">
                  Need another leader to manage routines or approvals? Submit a nomination to the System Developer. Once the developer approves your request, administrative privileges will be activated for the candidate.
                </p>

                <form onSubmit={handleSubAdminSubmitEscalation} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-1.5">
                      Candidate Member Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. co-leader@example.com"
                      value={requestCandidateEmail}
                      onChange={(e) => setRequestCandidateEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-1.5">
                      Reason / Responsibilities (Sent to Developer)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe why this member requires administrator access..."
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 text-xs focus:outline-none focus:border-purple-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Submit Request to Developer
                  </button>

                  {escalationSubmitStatus && (
                    <p className="text-xs font-bold text-center text-purple-300 mt-2 animate-fadeIn">
                      {escalationSubmitStatus}
                    </p>
                  )}
                </form>
              </div>

              {/* Status of previously submitted requests by this admin */}
              <div>
                <h4 className="text-xs font-black text-white/60 uppercase tracking-wider mb-3">
                  Your Submitted Admin Nominations
                </h4>
                {users.filter(u => Boolean(currentUser?.email) && u.adminRequestedBy?.toLowerCase() === currentUser?.email?.toLowerCase()).length === 0 ? (
                  <p className="text-xs text-white/40 italic">No admin nominations submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {users.filter(u => Boolean(currentUser?.email) && u.adminRequestedBy?.toLowerCase() === currentUser?.email?.toLowerCase()).map(cand => (
                      <div key={cand.uid} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{cand.displayName || cand.email}</p>
                          <p className="text-[10px] text-white/40">{cand.email}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          cand.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : cand.adminRequestStatus === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                        }`}>
                          {cand.role === 'admin' ? '✓ Approved' : cand.adminRequestStatus === 'rejected' ? 'Rejected' : 'Pending Developer Review'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* REASSIGN ADMIN MODAL (SUPER ADMIN ONLY) */}
      {reassignTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md glass border border-white/20 p-6 rounded-3xl space-y-4 animate-scaleIn">
            <h3 className="text-base font-black text-white">
              Reassign {reassignTarget.displayName || reassignTarget.email}
            </h3>
            <p className="text-xs text-white/60">
              Select which Administrator this user will be assigned under:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => handleReassign('root')}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-bold text-white flex items-center justify-between"
              >
                <span>Direct / Root System</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </button>

              {adminList.map(a => (
                <button
                  key={a.uid}
                  onClick={() => handleReassign(a.email, a.uid)}
                  className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-bold text-white flex items-center justify-between"
                >
                  <div>
                    <p>{a.displayName || a.email}</p>
                    <p className="text-[10px] text-white/40">{a.email}</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReassignTarget(null)}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
