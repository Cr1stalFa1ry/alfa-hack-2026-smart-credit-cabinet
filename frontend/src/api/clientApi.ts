import { apiClient } from './apiClient';
import { CreditApplication, CreateDraftRequest, UploadedDocument, ApplicationStatus } from '../types/application';
import { CreditProductConfig, ProductCode } from '../types/products';
import { CREDIT_PRODUCTS, ALL_PRODUCTS } from '../config/products';
import { mockStore } from './mockStore';
import { userStore } from './userStore';
import { egripApi } from './egripApi';

function isDemoActive(): boolean {
  return localStorage.getItem('smart_kabinet_demo_mode') === 'true';
}

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('smart_kabinet_user');
    if (raw) {
      const u = JSON.parse(raw);
      return u.id || u.userId || 'current-user';
    }
  } catch {
    // ignore
  }
  return 'current-user';
}

const NUMERIC_STATUS_MAP: Record<string, ApplicationStatus> = {
  '0': 'draft',
  '1': 'checking',
  '2': 'checking',
  '3': 'waiting_check',
  '4': 'need_info',
  '5': 'checking',
  '6': 'review',
  '7': 'offer',
  '8': 'closed',
  '9': 'closed',
  '10': 'declined',
  '11': 'accepted',
  '12': 'signed_sim',
  '13': 'closed',
  'draft': 'draft',
  'submitted': 'checking',
  'checking': 'checking',
  'waitingcheck': 'waiting_check',
  'waiting_check': 'waiting_check',
  'needinfo': 'need_info',
  'need_info': 'need_info',
  'inforeceived': 'checking',
  'review': 'review',
  'offer': 'offer',
  'declined': 'declined',
  'accepted': 'accepted',
  'signedsim': 'signed_sim',
  'signed_sim': 'signed_sim',
  'disbursedsim': 'disbursed_sim',
  'disbursed_sim': 'disbursed_sim',
  'closed': 'closed',
};

export function normalizeStatus(val: any): ApplicationStatus {
  if (val === undefined || val === null) return 'draft';
  const raw = String(val).trim();
  const lower = raw.toLowerCase().replace(/_/g, '');
  return NUMERIC_STATUS_MAP[raw] || NUMERIC_STATUS_MAP[lower] || (raw.toLowerCase() as ApplicationStatus);
}

export function mapBackendApplication(item: any): CreditApplication {
  const stage = item.stage === 2 || item.businessType === 'prelaunch' ? 'prelaunch' : 'operating';
  const purposeCode = item.purpose === 1 || item.purposeCode === 'equipment' || String(item.purpose).toLowerCase().includes('оборудован')
    ? 'equipment'
    : 'working_capital';

  const productCode = item.productCode
    ? String(item.productCode).toUpperCase()
    : purposeCode === 'equipment'
    ? 'EQ'
    : stage === 'prelaunch'
    ? 'START'
    : 'WC';

  return {
    id: String(item.id || item.applicationId),
    inn: item.inn || '',
    companyName: item.companyName || `ИП (ИНН ${item.inn || ''})`,
    productCode: productCode as any,
    stage,
    businessType: stage,
    purposeCode,
    requestedAmount: Number(item.requestedAmount || 0),
    ownContribution: Number(item.ownContribution || 0),
    equipmentPrice: item.equipmentPrice ? Number(item.equipmentPrice) : undefined,
    equipmentSupplier: item.equipmentSupplier,
    equipmentList: item.equipmentList,
    requestedTermMonths: Number(item.requestedTermMonths || 12),
    neededByDate: item.neededByDate,
    asSoonAsPossible: item.asSoonAsPossible ?? true,
    bkiConsent: item.bkiConsent ?? true,
    personalDataConsent: item.personalDataConsent ?? true,
    purpose: item.purpose || 'Кредит на развитие бизнеса',
    monthlyRevenue: Number(item.monthlyRevenue || 0),
    monthlyExpenses: Number(item.monthlyExpenses || 0),
    clientAnswers: item.clientAnswers,
    specialistNotes: item.specialistNotes,
    scenario: item.scenario,
    submissionPayload: item.submissionPayload,
    status: normalizeStatus(item.status),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    documents: item.documents || [],
    history: item.history || [],
    needInfoPrompt: item.needInfoPrompt,
    declineReason: item.declineReason,
    offer: item.currentOffer || item.offer ? {
      approvedAmount: Number(item.currentOffer?.approvedAmount || item.offer?.approvedAmount || item.requestedAmount),
      approvedTermMonths: Number(item.currentOffer?.termMonths || item.offer?.approvedTermMonths || 12),
      annualInterestRate: Number(item.currentOffer?.annualRatePercent || item.offer?.annualInterestRate || 18.5),
      monthlyPayment: Number(item.currentOffer?.monthlyPayment || item.offer?.monthlyPayment || 0),
      totalRepayment: Number(item.currentOffer?.totalRepayment || item.offer?.totalRepayment || 0),
      expirationDate: item.currentOffer?.expirationDate || item.offer?.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      alternativeTerms: item.offer?.alternativeTerms,
      isAccepted: item.offer?.isAccepted || false,
    } : undefined,
  };
}

export const clientApi = {
  getMyApplications: async (): Promise<CreditApplication[]> => {
    // In Demo Mode: return showcase mock applications
    if (isDemoActive()) {
      return mockStore.getAll();
    }

    // In Real Mode: fetch strictly from backend
    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get<any[]>('/client/applications', { timeout: 2500 });
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendApplication);
      }
    } catch {
      // Backend offline or endpoint error: return ONLY this user's created applications (or [] if none)
    }

    return userStore.getApplications(userId);
  },

  getApplicationById: async (id: string): Promise<CreditApplication> => {
    if (isDemoActive()) {
      const app = mockStore.getById(id);
      if (!app) throw new Error('Заявка не найдена');
      return app;
    }

    const userId = getCurrentUserId();
    try {
      const res = await apiClient.get<any>(`/client/applications/${id}`, { timeout: 2500 });
      if (res.data) {
        return mapBackendApplication(res.data);
      }
    } catch {
      // ignore
    }

    const localApp = userStore.getApplicationById(userId, id);
    if (localApp) return localApp;

    // Fallback if accessed via direct URL in demo
    const fallbackApp = mockStore.getById(id);
    if (fallbackApp) return fallbackApp;

    throw new Error('Заявка не найдена');
  },

  createDraft: async (data: CreateDraftRequest): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    const egrip = await egripApi.getCompanyByInn(data.inn);
    const companyTitle = egrip?.fullName || data.companyName || `ИП (ИНН ${data.inn})`;

    const stage = data.stage || (data.businessType === 'prelaunch' ? 'prelaunch' : 'operating');
    const purposeCode = data.purposeCode || (data.purpose?.toLowerCase().includes('оборудован') ? 'equipment' : 'working_capital');
    const productCode = data.productCode || (purposeCode === 'equipment' ? 'EQ' : (stage === 'prelaunch' ? 'START' : 'WC'));

    let createdApp: CreditApplication = {
      id: `app-${Date.now().toString().slice(-6)}`,
      inn: data.inn,
      companyName: companyTitle,
      productCode,
      stage,
      businessType: stage,
      purposeCode,
      requestedAmount: data.requestedAmount,
      ownContribution: data.ownContribution || 0,
      equipmentPrice: data.equipmentPrice,
      equipmentSupplier: data.equipmentSupplier,
      requestedTermMonths: data.requestedTermMonths,
      neededByDate: data.neededByDate,
      asSoonAsPossible: data.asSoonAsPossible ?? true,
      bkiConsent: data.bkiConsent ?? false,
      bkiConsentDate: data.bkiConsent ? (data.bkiConsentDate || new Date().toISOString()) : undefined,
      bkiConsentValidUntil: data.bkiConsent ? new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString() : undefined,
      personalDataConsent: data.personalDataConsent ?? false,
      personalDataConsentDate: data.personalDataConsent ? (data.personalDataConsentDate || new Date().toISOString()) : undefined,
      leasingPartnerConsent: data.leasingPartnerConsent ?? false,
      leasingPartnerName: data.leasingPartnerName,
      leasingPartnerConsentDate: data.leasingPartnerConsent ? (data.leasingPartnerConsentDate || new Date().toISOString()) : undefined,
      purpose: data.purpose,
      monthlyRevenue: data.monthlyRevenue,
      monthlyExpenses: data.monthlyExpenses,
      clientAnswers: data.clientAnswers,
      specialistNotes: data.specialistNotes,
      scenario: data.scenario,
      submissionPayload: data.submissionPayload,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
      history: [
        {
          id: `hist-${Date.now()}`,
          transitionCode: 'T01',
          fromStatus: 'draft',
          toStatus: 'draft',
          actor: 'client',
          actorName: 'Клиент ИП',
          comment: `Создание черновика заявки на продукт ${productCode}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Try posting to backend
    if (!isDemoActive()) {
      try {
        const res = await apiClient.post<any>('/client/applications/draft', {
          inn: data.inn,
          stage: stage === 'prelaunch' ? 2 : 1,
          purpose: purposeCode === 'equipment' ? 1 : 2,
          productCode,
          requestedAmount: data.requestedAmount,
          ownContribution: data.ownContribution || 0,
          requestedTermMonths: data.requestedTermMonths,
          purposeComment: data.purpose,
          businessType: stage,
          monthlyRevenue: data.monthlyRevenue,
          monthlyExpenses: data.monthlyExpenses,
          equipmentSupplier: data.equipmentSupplier,
          equipmentPrice: data.equipmentPrice,
          bkiConsent: data.bkiConsent ?? true,
          personalDataConsent: data.personalDataConsent ?? true,
        }, { timeout: 2500 });

        if (res.data?.id || res.data?.applicationId) {
          createdApp.id = String(res.data.id || res.data.applicationId);
        }
      } catch {
        // saved locally
      }
      userStore.saveApplication(userId, createdApp);
      return createdApp;
    }

    mockStore.save(createdApp);
    return createdApp;
  },

  updateDraft: async (id: string, patch: Partial<CreditApplication>): Promise<CreditApplication> => {
    const userId = getCurrentUserId();

    if (!isDemoActive()) {
      try {
        await apiClient.put(`/client/applications/${id}/draft`, {
          requestedAmount: patch.requestedAmount,
          requestedTermMonths: patch.requestedTermMonths,
          bkiConsent: true,
          personalDataConsent: true,
        }, { timeout: 2500 });
      } catch {
        // fallback
      }

      const app = userStore.getApplicationById(userId, id);
      if (app) {
        const updated = { ...app, ...patch, updatedAt: new Date().toISOString() };
        userStore.saveApplication(userId, updated);
        return updated;
      }
    }

    const app = mockStore.getById(id);
    if (!app) throw new Error('Заявка не найдена');
    const updated: CreditApplication = {
      ...app,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    mockStore.save(updated);
    return updated;
  },

  submitApplication: async (id: string): Promise<CreditApplication> => {
    const userId = getCurrentUserId();

    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/submit`, {}, { timeout: 2500 });
      } catch {
        // fallback
      }

      return userStore.transition(
        userId,
        id,
        'T03',
        'checking',
        'client',
        'Клиент ИП',
        'Заявка успешно отправлена на скоринг и проверку стоп-факторов'
      );
    }

    const updated = mockStore.transition(
      id,
      'T03',
      'checking',
      'client',
      'Клиент ИП',
      'Заявка успешно отправлена на скоринг и проверку стоп-факторов'
    );

    // In demo mode: simulate auto-progression after 3 seconds
    setTimeout(() => {
      const current = mockStore.getById(id);
      if (current && current.status === 'checking') {
        if (current.requestedAmount > 2000000) {
          mockStore.transition(
            id,
            'T07',
            'review',
            'system',
            'SmartKabinet.Checking',
            'Сумма кредита превышает лимит экспресс-проверки. Передано аналитику банка'
          );
        } else {
          mockStore.transition(
            id,
            'T08',
            'offer',
            'system',
            'SmartKabinet.Checking',
            'Автоматическое одобрение скорингом. Оферта сформирована',
            undefined,
            {
              offer: {
                approvedAmount: current.requestedAmount,
                approvedTermMonths: current.requestedTermMonths,
                annualInterestRate: 15.2,
                monthlyPayment: Math.round((current.requestedAmount * 1.15) / current.requestedTermMonths),
                totalRepayment: Math.round(current.requestedAmount * 1.15),
                expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(),
              },
            }
          );
        }
      }
    }, 3000);

    return updated;
  },

  retryCheck: async (id: string): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/retry-check`, {}, { timeout: 2500 });
      } catch {
        // fallback
      }
      return userStore.transition(
        userId,
        id,
        'T06',
        'checking',
        'client',
        'Клиент ИП',
        'Повторный запуск проверки после сбоя внешнего сервиса'
      );
    }

    return mockStore.transition(
      id,
      'T06',
      'checking',
      'client',
      'Клиент ИП',
      'Повторный запуск проверки после сбоя внешнего сервиса'
    );
  },

  replyNeedInfo: async (id: string, responseText: string): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/respond-info`, {
          comment: responseText,
        }, { timeout: 2500 });
      } catch {
        // fallback
      }
      return userStore.transition(
        userId,
        id,
        'T10',
        'checking',
        'client',
        'Клиент ИП',
        'Клиент предоставил запрошенные банком сведения',
        undefined,
        { needInfoResponse: responseText }
      );
    }

    return mockStore.transition(
      id,
      'T10',
      'checking',
      'client',
      'Клиент ИП',
      'Клиент предоставил запрошенные банком сведения',
      undefined,
      { needInfoResponse: responseText }
    );
  },

  withdrawApplication: async (id: string, reason?: string): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/withdraw`, {}, { timeout: 2500 });
      } catch {
        // fallback
      }
      return userStore.transition(
        userId,
        id,
        'T17',
        'closed',
        'client',
        'Клиент ИП',
        reason || 'Клиент отозвал заявку по собственному желанию'
      );
    }

    return mockStore.transition(
      id,
      'T17',
      'closed',
      'client',
      'Клиент ИП',
      reason || 'Клиент отозвал заявку по собственному желанию'
    );
  },

  acceptOffer: async (id: string, useAlternativeTerm: boolean = false): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    const app = isDemoActive() ? mockStore.getById(id) : userStore.getApplicationById(userId, id);
    if (!app || !app.offer) throw new Error('Оферта не найдена');

    const updatedOffer = {
      ...app.offer,
      isAccepted: true,
      approvedTermMonths: useAlternativeTerm && app.offer.alternativeTerms
        ? app.offer.alternativeTerms.newTermMonths
        : app.offer.approvedTermMonths,
      monthlyPayment: useAlternativeTerm && app.offer.alternativeTerms
        ? app.offer.alternativeTerms.newMonthlyPayment
        : app.offer.monthlyPayment,
    };

    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/accept`, {});
      } catch {
        // fallback
      }
      return userStore.transition(
        userId,
        id,
        'T21' as any,
        'accepted' as any,
        'client',
        'Клиент ИП',
        `Клиент подтвердил согласие с условиями оферты (${updatedOffer.approvedTermMonths} мес, ${updatedOffer.monthlyPayment} ₽/мес)`,
        undefined,
        { offer: updatedOffer }
      );
    }

    return mockStore.transition(
      id,
      'T21' as any,
      'accepted' as any,
      'client',
      'Клиент ИП',
      `Клиент подтвердил согласие с условиями оферты (${updatedOffer.approvedTermMonths} мес, ${updatedOffer.monthlyPayment} ₽/мес)`,
      undefined,
      { offer: updatedOffer }
    );
  },

  signAgreement: async (id: string, smsCode: string = '1234'): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/sign`, { smsCode });
      } catch {
        // fallback
      }
      return userStore.transition(
        userId,
        id,
        'T22' as any,
        'signed_sim' as any,
        'client',
        'Клиент ИП',
        'Кредитный договор подписан электронной подписью (симуляция ЭЦП/SMS)'
      );
    }
    return mockStore.transition(
      id,
      'T22' as any,
      'signed_sim' as any,
      'client',
      'Клиент ИП',
      'Кредитный договор подписан электронной подписью (симуляция ЭЦП/SMS)'
    );
  },

  disburseFunds: async (id: string): Promise<CreditApplication> => {
    const userId = getCurrentUserId();
    if (!isDemoActive()) {
      try {
        await apiClient.post(`/client/applications/${id}/disburse`, {});
      } catch {
        // fallback
      }
      return userStore.transition(
        userId,
        id,
        'T23' as any,
        'disbursed_sim' as any,
        'system',
        'SmartKabinet Engine',
        'Кредитные средства успешно зачислены на расчётный счёт ИП'
      );
    }
    return mockStore.transition(
      id,
      'T23' as any,
      'disbursed_sim' as any,
      'system',
      'SmartKabinet Engine',
      'Кредитные средства успешно зачислены на расчётный счёт ИП'
    );
  },

  uploadDocument: async (id: string, file: File): Promise<UploadedDocument> => {
    const doc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType: file.name.endsWith('.pdf') ? 'bank_statement' : 'other',
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    };

    const userId = getCurrentUserId();
    if (!isDemoActive()) {
      const app = userStore.getApplicationById(userId, id);
      if (app) {
        app.documents = [...(app.documents || []), doc];
        userStore.saveApplication(userId, app);
      }
    } else {
      const app = mockStore.getById(id);
      if (app) {
        app.documents = [...(app.documents || []), doc];
        mockStore.save(app);
      }
    }

    return doc;
  },

  getCreditProducts: async (): Promise<CreditProductConfig[]> => {
    if (!isDemoActive()) {
      try {
        const res = await apiClient.get<any[]>('/products');
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map((p) => {
            const code = (p.code || 'WC').toUpperCase() as ProductCode;
            const base = CREDIT_PRODUCTS[code] || CREDIT_PRODUCTS.WC;
            return {
              ...base,
              name: p.name || base.name,
              description: p.description || base.description,
              minAmount: Number(p.minAmount ?? base.minAmount),
              maxAmount: Number(p.maxAmount ?? base.maxAmount),
              minTermMonths: Number(p.minTermMonths ?? base.minTermMonths),
              maxTermMonths: Number(p.maxTermMonths ?? base.maxTermMonths),
              minInterestRate: Number(p.minInterestRate ?? base.minInterestRate),
              maxInterestRate: Number(p.maxInterestRate ?? base.maxInterestRate),
              decisionRule: p.conditions || base.decisionRule,
            };
          });
        }
      } catch {
        // use local config fallback
      }
    }
    return ALL_PRODUCTS;
  },

  getCreditProductByCode: async (code: ProductCode): Promise<CreditProductConfig> => {
    const products = await clientApi.getCreditProducts();
    const found = products.find((p) => p.code === code);
    return found || CREDIT_PRODUCTS[code] || CREDIT_PRODUCTS.WC;
  },
};
