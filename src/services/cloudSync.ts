import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { UserProfile, TaskItem, RoutineItem, DailyProgress, CardItem } from '../types/index';

export interface SyncedAppData {
  tasks: TaskItem[];
  routine: RoutineItem[];
  progress: DailyProgress[];
  goals: CardItem[];
  dreams: CardItem[];
  lastSyncedAt: string;
}

export async function backupLocalDataToCloud(user: UserProfile): Promise<boolean> {
  if (!user || user.status !== 'active') return false;

  const tasks: TaskItem[] = JSON.parse(localStorage.getItem('vtm_tasks_v6') || '[]');
  const routine: RoutineItem[] = JSON.parse(localStorage.getItem('vtm_routine_v6') || '[]');
  const progress: DailyProgress[] = JSON.parse(localStorage.getItem('vtm_progress_v6') || '[]');
  const goals: CardItem[] = JSON.parse(localStorage.getItem('vtm_goals_v6') || '[]');
  const dreams: CardItem[] = JSON.parse(localStorage.getItem('vtm_dreams_v6') || '[]');

  const payload: SyncedAppData = {
    tasks,
    routine,
    progress,
    goals,
    dreams,
    lastSyncedAt: new Date().toISOString()
  };

  if (!isFirebaseConfigured) {
    // In mock/offline mode, store in simulated cloud store
    localStorage.setItem(`vtm_cloud_${user.uid}`, JSON.stringify(payload));
    return true;
  }

  try {
    const dataRef = doc(db, 'users', user.uid, 'cloud_data', 'main_state');
    await setDoc(dataRef, payload, { merge: true });

    // Mark user profile as migrated
    const profileRef = doc(db, 'users', user.uid);
    await setDoc(profileRef, { hasMigratedLocalData: true }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to sync data to cloud:', error);
    return false;
  }
}

export async function fetchCloudData(userId: string): Promise<SyncedAppData | null> {
  if (!isFirebaseConfigured) {
    const mock = localStorage.getItem(`vtm_cloud_${userId}`);
    return mock ? JSON.parse(mock) : null;
  }

  try {
    const dataRef = doc(db, 'users', userId, 'cloud_data', 'main_state');
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return snap.data() as SyncedAppData;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch cloud data:', error);
    return null;
  }
}
