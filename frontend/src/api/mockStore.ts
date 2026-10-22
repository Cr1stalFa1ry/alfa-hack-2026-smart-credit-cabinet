import { CreditApplication, ApplicationStatus, StateTransitionRecord, TransitionCode } from '../types/application';
import { INITIAL_MOCK_APPLICATIONS } from './mockData';

const STORAGE_KEY = 'smart_kabinet_demo_applications';

export const mockStore = {
  getAll: (): CreditApplication[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_APPLICATIONS));
      return INITIAL_MOCK_APPLICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_APPLICATIONS;
    }
  },

  getById: (id: string): CreditApplication | undefined => {
    const apps = mockStore.getAll();
    return apps.find((a) => a.id === id);
  },

  save: (app: CreditApplication): void => {
    const apps = mockStore.getAll();
    const index = apps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      apps[index] = app;
    } else {
      apps.unshift(app);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  },

  transition: (
    id: string,
    transitionCode: TransitionCode,
    toStatus: ApplicationStatus,
    actor: 'client' | 'system' | 'analyst',
    actorName: string,
    comment?: string,
    reasonCode?: string,
    patch?: Partial<CreditApplication>
  ): CreditApplication => {
    const app = mockStore.getById(id);
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

    mockStore.save(updated);
    return updated;
  },

  reset: (): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_APPLICATIONS));
  },
};
