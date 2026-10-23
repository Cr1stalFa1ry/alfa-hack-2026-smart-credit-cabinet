import { CreditApplication, ApplicationStatus, StateTransitionRecord, TransitionCode } from '../types/application';

function getUserStorageKey(userId: string): string {
  return `smart_kabinet_user_apps_${userId}`;
}

export const userStore = {
  getApplications: (userId: string): CreditApplication[] => {
    if (!userId) return [];
    const raw = localStorage.getItem(getUserStorageKey(userId));
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getApplicationById: (userId: string, id: string): CreditApplication | undefined => {
    const apps = userStore.getApplications(userId);
    return apps.find((a) => a.id === id);
  },

  getAllApplications: (): CreditApplication[] => {
    const allApps: CreditApplication[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smart_kabinet_user_apps_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              allApps.push(...list);
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return allApps;
  },

  findApplicationAcrossUsers: (id: string): CreditApplication | undefined => {
    const apps = userStore.getAllApplications();
    return apps.find((a) => a.id === id);
  },

  saveApplication: (userId: string, app: CreditApplication): void => {
    if (!userId) return;
    const apps = userStore.getApplications(userId);
    const index = apps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      apps[index] = app;
    } else {
      apps.unshift(app);
    }
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(apps));
  },

  transition: (
    userId: string,
    id: string,
    transitionCode: TransitionCode,
    toStatus: ApplicationStatus,
    actor: 'client' | 'system' | 'analyst',
    actorName: string,
    comment?: string,
    reasonCode?: string,
    patch?: Partial<CreditApplication>
  ): CreditApplication => {
    const app = userStore.getApplicationById(userId, id);
    if (!app) throw new Error(`Application ${id} not found`);

    const transitionRecord: StateTransitionRecord = {
      id: `hist-${Date.now()}`,
      transitionCode,
      fromStatus: app.status,
      toStatus,
      actor,
      actorName,
      comment,
      reasonCode,
      timestamp: new Date().toISOString(),
    };

    const updated: CreditApplication = {
      ...app,
      ...patch,
      status: toStatus,
      updatedAt: new Date().toISOString(),
      history: [transitionRecord, ...(app.history || [])],
    };

    userStore.saveApplication(userId, updated);
    return updated;
  },
};
