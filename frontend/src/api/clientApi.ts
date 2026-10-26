import { apiClient } from './apiClient';
import { CreditApplication, CreateDraftRequest, UploadedDocument, ApplicationStatus } from '../types/application';
import { CreditProductConfig, ProductCode } from '../types/products';
import { CREDIT_PRODUCTS, ALL_PRODUCTS } from '../config/products';
import { egripApi } from './egripApi';
import { applicationStore } from '../utils/applicationStore';

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
  '10': 'offer',
  '11': 'signed_sim',
  '12': 'signed_sim',
  '13': 'disbursed_sim',
  '14': 'declined',
  '15': 'accepted',
  '16': 'closed',
  'draft': 'draft',
  'submitted': 'checking',
  'checking': 'checking',
  'waitingcheck': 'waiting_check',
  'waiting_check': 'waiting_check',
  'needinfo': 'need_info',
  'need_info': 'need_info',
  'inforeceived': 'checking',
  'info_received': 'checking',
  'review': 'review',
  'offer': 'offer',
  'offerrejected': 'closed',
  'offer_rejected': 'closed',
  'offerexpired': 'closed',
  'offer_expired': 'closed',
  'preconditions': 'offer',
  'pre_conditions': 'offer',
  'signedsim': 'signed_sim',
  'signed_sim': 'signed_sim',
  'readytodisburse': 'signed_sim',
  'ready_to_disburse': 'signed_sim',
  'disbursedsim': 'disbursed_sim',
  'disbursed_sim': 'disbursed_sim',
  'declined': 'declined',
  'accepted': 'accepted',
  'approved': 'offer',
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

    const offerSource = item.currentOffer || item.offer;
    const resolvedTerm = Number(offerSource?.termMonths || offerSource?.approvedTermMonths || item.requestedTermMonths || 12);
    const resolvedRate = Number(offerSource?.annualRatePercent || offerSource?.annualInterestRate || 18.5);
    const resolvedPayment = Number(offerSource?.monthlyPayment || 0);
    const resolvedTotal = Number(
      offerSource?.totalRepayment ||
      (resolvedPayment > 0 ? resolvedPayment * resolvedTerm : 0)
    );

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
      expensePeriod: item.expensePeriod,
      hasContract: item.hasExpenseContract ? 'Да' : (item.hasExpenseContract === false ? 'Нет' : item.hasContract),
      hasExpenseContract: item.hasExpenseContract,
      isTaxRegimeActual: item.isTaxRegimeActual,
      declaredTaxRegime: item.declaredTaxRegime,
      receiptCoverage: item.receiptCoverage,
      expensesCoverageStatus: item.expensesCoverageStatus,
      hasAdditionalIncome: item.hasAdditionalIncome,
      additionalIncomeAmount: item.additionalIncomeAmount ? Number(item.additionalIncomeAmount) : undefined,
      debtsVerificationStatus: item.debtsVerificationStatus,
      repaymentSourceDescription: item.repaymentSourceDescription,
      householdExpenses: item.householdExpenses ? Number(item.householdExpenses) : undefined,
      existingMonthlyObligations: item.existingMonthlyObligations ? Number(item.existingMonthlyObligations) : undefined,
      asSoonAsPossible: item.asSoonAsPossible ?? true,
      bkiConsent: item.bkiConsent ?? item.clientAnswers?.bkiConsent ?? false,
      personalDataConsent: item.personalDataConsent ?? item.clientAnswers?.personalDataConsent ?? false,
      bkiConsentDate: item.bkiConsentDate || item.clientAnswers?.bkiConsentDate,
      bkiConsentValidUntil: item.bkiConsentValidUntil || item.clientAnswers?.bkiConsentValidUntil,
      personalDataConsentDate: item.personalDataConsentDate || item.clientAnswers?.personalDataConsentDate,
      leasingPartnerConsent: item.leasingPartnerConsent ?? item.clientAnswers?.leasingPartnerConsent ?? false,
      leasingPartnerName: item.leasingPartnerName || item.clientAnswers?.leasingPartnerName || 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
      leasingPartnerConsentDate: item.leasingPartnerConsentDate || item.clientAnswers?.leasingPartnerConsentDate,
      purpose: item.purpose || 'Кредит на развитие бизнеса',
      monthlyRevenue: Number(item.monthlyRevenue || 0),
      monthlyExpenses: Number(item.monthlyExpenses || 0),
      clientAnswers: item.clientAnswers || applicationStore.getById(String(item.id || item.applicationId))?.clientAnswers || (item.submissionPayload?.clientAnswers),
      specialistNotes: item.specialistNotes || applicationStore.getById(String(item.id || item.applicationId))?.specialistNotes,
      scenario: item.scenario || (String(item.productCode).toUpperCase() === 'RESTART' ? 'paused' : undefined) || applicationStore.getById(String(item.id || item.applicationId))?.scenario,
      submissionPayload: item.submissionPayload || applicationStore.getById(String(item.id || item.applicationId))?.submissionPayload,
      status: normalizeStatus(item.status),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      documents: Array.isArray(item.documents)
        ? item.documents.map((d: any) => ({
            id: String(d.id),
            fileName: d.fileName,
            fileSizeBytes: Number(d.fileSizeBytes || 0),
            fileType: d.fileType || 'other',
            uploadedAt: d.uploadedAt || new Date().toISOString(),
            status: d.status || 'uploaded',
            downloadUrl: d.downloadUrl || (d.fileKey ? `/api/infrastructure/storage/${d.fileKey}` : undefined),
          }))
        : [],
      history: Array.isArray(item.history)
        ? item.history
            .filter((h: any) => {
              const isAutosave =
                h.transitionCode === 'T02' ||
                h.reasonCode === 'T02' ||
                (h.fromStatus === 'draft' &&
                  h.toStatus === 'draft' &&
                  (h.comment?.includes('T02') || h.comment?.includes('Сохранены изменения')));
              return !isAutosave;
            })
            .map((h: any) => {
              let code = h.transitionCode || h.reasonCode || 'T00';
              if (code === 'T00' && h.comment) {
                const match = h.comment.match(/\b(T\d{2})\b/);
                if (match) code = match[1];
              }
              return {
                id: String(h.id),
                transitionCode: code,
                fromStatus: normalizeStatus(h.fromStatus),
                toStatus: normalizeStatus(h.toStatus),
                actor: (h.actor as any) || 'system',
                actorName:
                  h.actorName ||
                  (h.actor === 'analyst'
                    ? 'Кредитный аналитик'
                    : h.actor === 'client'
                    ? 'Заявитель (ИП)'
                    : 'Система скоринга'),
                comment: h.comment,
                timestamp: h.timestamp || new Date().toISOString(),
              };
            })
        : [],
      needInfoPrompt: item.needInfoPrompt || (Array.isArray(item.history) ? item.history.filter((h: any) => (h.toStatus === 'need_info' || h.toStatus === 4 || h.reasonCode === 'T11' || h.reasonCode === 'T04') && h.comment).slice(-1)[0]?.comment : undefined),
      needInfoResponse: item.needInfoResponse || (Array.isArray(item.history) ? item.history.filter((h: any) => (h.fromStatus === 'need_info' || h.toStatus === 'info_received' || h.reasonCode === 'T10') && (h.actor === 'client' || !h.actor) && h.comment).slice(-1)[0]?.comment : undefined),
      needInfoRequestedAt: item.needInfoRequestedAt || (Array.isArray(item.history) ? item.history.filter((h: any) => (h.toStatus === 'need_info' || h.toStatus === 4 || h.reasonCode === 'T11' || h.reasonCode === 'T04')).slice(-1)[0]?.timestamp : undefined),
      needInfoActorName: item.needInfoActorName || (Array.isArray(item.history) ? item.history.filter((h: any) => (h.toStatus === 'need_info' || h.toStatus === 4 || h.reasonCode === 'T11' || h.reasonCode === 'T04')).slice(-1)[0]?.actorName : undefined),
      issues: item.issues || (item.scoring?.issues) || [],
      scoring: item.scoring,
      mlExplanation: item.mlExplanation,
      mlExplanationSource: item.mlExplanationSource,
      reasonCodes: item.reasonCodes || [],
      declineReason: item.declineReason,
      currentOffer: item.currentOffer,
      recommendedOffer: offerSource ? {
        approvedAmount: Number(offerSource.approvedAmount || item.requestedAmount),
        approvedTermMonths: resolvedTerm,
        annualInterestRate: resolvedRate,
        monthlyPayment: resolvedPayment,
        totalRepayment: resolvedTotal,
        expirationDate: offerSource.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        alternativeTerms: offerSource.alternativeTerms,
        isAccepted: offerSource.isAccepted || false,
        isCounterOffer: offerSource.isCounterOffer || false,
      } : undefined,
      offer: ['offer', 'accepted', 'signed_sim', 'disbursed_sim', 'pre_conditions', 'ready_to_disburse'].includes(normalizeStatus(item.status)) && offerSource ? {
        approvedAmount: Number(offerSource.approvedAmount || item.requestedAmount),
        approvedTermMonths: resolvedTerm,
        annualInterestRate: resolvedRate,
        monthlyPayment: resolvedPayment,
        totalRepayment: resolvedTotal,
        expirationDate: offerSource.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        alternativeTerms: offerSource.alternativeTerms,
        isAccepted: offerSource.isAccepted || false,
        isCounterOffer: offerSource.isCounterOffer || false,
      } : undefined,
    };
}

function getCurrentClientIdentity(): { inn?: string; userId?: string; username?: string } | null {
  try {
    const raw = localStorage.getItem('smart_kabinet_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        inn: parsed.inn || undefined,
        userId: parsed.id || parsed.userId || undefined,
        username: parsed.username || undefined,
      };
    }
  } catch {}
  return null;
}

function isAppOwnedByCurrentClient(app: CreditApplication, identity: { inn?: string; userId?: string; username?: string } | null): boolean {
  if (!identity) return false;
  if (identity.inn && app.inn) {
    return app.inn.trim() === identity.inn.trim();
  }
  if (identity.userId && (app as any).clientId) {
    return String((app as any).clientId) === String(identity.userId);
  }
  return false;
}

export const clientApi = {
  getMyApplications: async (): Promise<CreditApplication[]> => {
    const identity = getCurrentClientIdentity();
    try {
      const res = await apiClient.get<any>('/client/applications', { timeout: 4000 });
      const data = (res.data as any)?.value || res.data;
      if (Array.isArray(data)) {
        const mapped = data
          .map(mapBackendApplication)
          .filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO'));

        // Включаем из локального хранилища ТОЛЬКО заявки текущего клиента (строгая фильтрация по ИНН/userId)
        const local = applicationStore
          .getAll()
          .filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO') && isAppOwnedByCurrentClient(a, identity));

        const mapIds = new Set(mapped.map((m) => m.id));
        const combined = [...mapped, ...local.filter((l) => !mapIds.has(l.id))];
        return combined;
      }
    } catch (err) {
      console.warn('Backend client applications unavailable, using local store:', err);
      return applicationStore
        .getAll()
        .filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO') && isAppOwnedByCurrentClient(a, identity));
    }
    return [];
  },

  getApplicationById: async (id: string): Promise<CreditApplication> => {
    const identity = getCurrentClientIdentity();
    try {
      const res = await apiClient.get<any>(`/client/applications/${id}`, { timeout: 4000 });
      const data = res.data?.value || res.data;
      if (data) {
        const mapped = mapBackendApplication(data);
        applicationStore.saveApp(mapped);
        return mapped;
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        applicationStore.removeApp(id);
        throw new Error('Заявка не найдена');
      }
      console.warn(`Backend client getApplicationById ${id} error:`, err);
    }
    const local = applicationStore.getById(id);
    if (local && isAppOwnedByCurrentClient(local, identity)) return local;
    throw new Error('Заявка не найдена');
  },

  createDraft: async (data: CreateDraftRequest): Promise<CreditApplication> => {
    const isPaused = data.scenario === 'paused' || data.productCode === 'RESTART' || (data.clientAnswers as any)?.business === 'paused';
    const stage = data.stage || (data.businessType === 'prelaunch' ? 'prelaunch' : 'operating');
    const purposeCode = data.purposeCode || (data.purpose?.toLowerCase().includes('оборудован') ? 'equipment' : 'working_capital');
    const productCode = isPaused ? 'RESTART' : (data.productCode || (purposeCode === 'equipment' ? 'EQ' : (stage === 'prelaunch' ? 'START' : 'WC')));

    const res = await apiClient.post<any>('/client/applications/draft', {
      inn: data.inn,
      stage: stage === 'prelaunch' ? 2 : 1,
      purpose: purposeCode === 'equipment' ? 1 : 2,
      productCode,
      requestedAmount: data.requestedAmount,
      ownContribution: data.ownContribution || 0,
      requestedTermMonths: data.requestedTermMonths,
      bkiConsent: isPaused ? true : (data.bkiConsent ?? false),
      personalDataConsent: data.personalDataConsent ?? false,
      neededByDate: data.neededByDate,
      expensePeriod: data.expensePeriod,
      hasContract: data.hasContract,
      hasExpenseContract: data.hasExpenseContract ?? (data.hasContract === 'Да' || data.hasContract === 'yes'),
      isTaxRegimeActual: data.isTaxRegimeActual ?? true,
      declaredTaxRegime: data.declaredTaxRegime,
      receiptCoverage: data.receiptCoverage,
      expensesCoverageStatus: data.expensesCoverageStatus,
      hasAdditionalIncome: data.hasAdditionalIncome,
      additionalIncomeAmount: data.additionalIncomeAmount,
      debtsVerificationStatus: data.debtsVerificationStatus,
      repaymentSourceDescription: data.repaymentSourceDescription,
      householdExpenses: data.householdExpenses,
      existingMonthlyObligations: data.existingMonthlyObligations,
      monthlyRevenue: data.monthlyRevenue,
      monthlyExpenses: data.monthlyExpenses,
      clientAnswers: data.clientAnswers,
      specialistNotes: data.specialistNotes,
      scenario: data.scenario,
      submissionPayload: data.submissionPayload,
    });

    const resData = (res.data as any)?.value || res.data;
    return mapBackendApplication(resData);
  },

  saveDraft: async (id: string, data: Partial<CreateDraftRequest>): Promise<CreditApplication> => {
    const isPaused = data.scenario === 'paused' || data.productCode === 'RESTART' || (data.clientAnswers as any)?.business === 'paused';
    const productCode = isPaused ? 'RESTART' : data.productCode;
    const res = await apiClient.put<any>(`/client/applications/${id}/draft`, {
      requestedAmount: data.requestedAmount || 0,
      ownContribution: data.ownContribution || 0,
      requestedTermMonths: data.requestedTermMonths,
      bkiConsent: isPaused ? true : (data.bkiConsent ?? true),
      personalDataConsent: data.personalDataConsent ?? true,
      productCode,
      neededByDate: data.neededByDate,
      expensePeriod: data.expensePeriod,
      hasExpenseContract: data.hasExpenseContract ?? (data.hasContract === 'Да' || data.hasContract === 'yes'),
      isTaxRegimeActual: data.isTaxRegimeActual,
      declaredTaxRegime: data.declaredTaxRegime,
      receiptCoverage: data.receiptCoverage,
      expensesCoverageStatus: data.expensesCoverageStatus,
      hasAdditionalIncome: data.hasAdditionalIncome,
      additionalIncomeAmount: data.additionalIncomeAmount,
      debtsVerificationStatus: data.debtsVerificationStatus,
      repaymentSourceDescription: data.repaymentSourceDescription,
      householdExpenses: data.householdExpenses,
      existingMonthlyObligations: data.existingMonthlyObligations,
      monthlyRevenue: data.monthlyRevenue,
      monthlyExpenses: data.monthlyExpenses,
    });
    const resData = (res.data as any)?.value || res.data;
    return mapBackendApplication(resData);
  },

  updateDraft: async (id: string, data: Partial<CreateDraftRequest>): Promise<CreditApplication> => {
    return clientApi.saveDraft(id, data);
  },

  submitApplication: async (id: string): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/submit`);
    const resData = (res.data as any)?.value || res.data;
    return mapBackendApplication(resData);
  },

  retryCheck: async (id: string): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/retry`);
    const resData = (res.data as any)?.value || res.data;
    return mapBackendApplication(resData);
  },

  respondNeedInfo: async (id: string, response: string, files?: UploadedDocument[]): Promise<CreditApplication> => {
    const fileSuffix = files && files.length > 0
      ? `\nПрикрепленные документы (${files.length}): ${files.map((f) => f.fileName).join(', ')}`
      : '';
    const fullComment = `${response}${fileSuffix}`;

    try {
      await apiClient.post<any>(`/client/applications/${id}/respond-info`, {
        comment: fullComment,
        responseComment: fullComment,
      }, { timeout: 5000 });

      // Попытка сразу получить актуализированную заявку из бэкенда
      try {
        const freshApp = await clientApi.getApplicationById(id);
        if (freshApp) {
          const openReq = freshApp.requests?.find((r) => r.status === 'open' || r.status === 'responded');
          if (openReq) {
            openReq.files = files && files.length > 0 ? [...files] : [];
          }
          if (files && files.length > 0) {
            freshApp.needInfoFiles = [...files];
            const existingIds = new Set((freshApp.documents || []).map((d) => d.id));
            const newFiles = files.filter((f) => !existingIds.has(f.id));
            freshApp.documents = [...(freshApp.documents || []), ...newFiles];
          } else {
            freshApp.needInfoFiles = undefined;
          }
          applicationStore.saveApp(freshApp);
          return freshApp;
        }
      } catch {
        // Fallback to local store update below
      }
    } catch (err) {
      console.warn('Backend respond-info error (handled offline):', err);
    }
    const app = applicationStore.getById(id);
    const openReq = app?.requests?.find((r) => r.status === 'open');
    if (openReq) {
      applicationStore.replyClientRequest(id, openReq.id, response, files);
    } else {
      if (app) {
        app.needInfoFiles = files && files.length > 0 ? [...files] : undefined;
        if (files && files.length > 0) {
          const existingIds = new Set((app.documents || []).map((d) => d.id));
          const newFiles = files.filter((f) => !existingIds.has(f.id));
          app.documents = [...(app.documents || []), ...newFiles];
        }
      }
      applicationStore.setStatus(id, 'checking', fullComment);
      if (app && app.history && app.history.length > 0) {
        app.history[app.history.length - 1].files = files && files.length > 0 ? [...files] : [];
      }
    }
    return applicationStore.getById(id)!;
  },

  replyNeedInfo: async (id: string, response: string, files?: UploadedDocument[]): Promise<CreditApplication> => {
    return clientApi.respondNeedInfo(id, response, files);
  },

  acceptOffer: async (id: string, useAlternative?: boolean): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/accept`, {
      useAlternative: Boolean(useAlternative),
    });
    const resData = (res.data as any)?.value || res.data;
    return mapBackendApplication(resData);
  },

  requestAlternativeOffer: async (
    id: string,
    params: {
      requestedAmount?: number;
      requestedTermMonths?: number;
      desiredMonthlyPayment?: number;
      comment?: string;
    }
  ): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/request-alternative`, params);
    const resData = (res.data as any)?.value || res.data;
    // После запроса альтернативы запрашиваем актуальное состояние заявки
    try {
      return await clientApi.getApplicationById(id);
    } catch {
      return mapBackendApplication(resData);
    }
  },

  signDocuments: async (id: string): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/sign`);
    const resData = res.data?.value || res.data;
    return mapBackendApplication(resData);
  },

  disburseFunds: async (id: string): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/disburse`);
    const resData = res.data?.value || res.data;
    return mapBackendApplication(resData);
  },

  withdrawApplication: async (id: string, reason?: string): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/withdraw`, {
      reason: reason || 'Отозвана клиентом',
    });
    const resData = res.data?.value || res.data;
    return mapBackendApplication(resData);
  },

  uploadDocument: async (id: string, file: File, documentType?: string): Promise<UploadedDocument> => {
    const fileType = documentType || (file.name.endsWith('.pdf') ? 'bank_statement' : 'other');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', fileType);

    const res = await apiClient.post<any>(`/client/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = res.data?.value || res.data;
    return {
      id: String(data.id),
      fileName: data.fileName || file.name,
      fileSizeBytes: Number(data.fileSizeBytes || file.size),
      fileType: (data.fileType as any) || fileType,
      uploadedAt: data.uploadedAt || new Date().toISOString(),
      status: (data.status as any) || 'uploaded',
      downloadUrl: data.downloadUrl || (data.fileKey ? `/api/infrastructure/storage/${data.fileKey}` : undefined),
    };
  },

  deleteDocument: async (id: string, docId: string): Promise<void> => {
    await apiClient.delete(`/client/applications/${id}/documents/${docId}`);
  },

  getCreditProducts: async (): Promise<CreditProductConfig[]> => {
    try {
      const res = await apiClient.get<any>('/products');
      const data = (res.data as any)?.value || res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p) => {
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
      // Fallback to static product catalog
    }
    return ALL_PRODUCTS;
  },

  getCreditProductByCode: async (code: ProductCode): Promise<CreditProductConfig> => {
    const products = await clientApi.getCreditProducts();
    const found = products.find((p) => p.code === code);
    return found || CREDIT_PRODUCTS[code] || CREDIT_PRODUCTS.WC;
  },

  lookupCompany: async (inn: string): Promise<CompanyLookupResponse | null> => {
    const cleanInn = inn.trim();
    if (!cleanInn) return null;
    try {
      const res = await apiClient.get<any>(`/client/companies/lookup`, {
        params: { inn: cleanInn },
        timeout: 5000,
      });
      const data = (res.data as any)?.value || res.data;
      if (data && data.inn) {
        return data as CompanyLookupResponse;
      }
    } catch {
      // 404 or backend lookup not found
    }
    return null;
  },

  uploadAndAnalyzeStatement: async (id: string, file: File): Promise<{
    applicationId: string;
    status: string;
    reason?: string;
    message?: string;
    metrics?: {
      avgMonthlyRevenueRub: number;
      avgMonthlyExpensesRub: number;
      avgMonthlyNetRub: number;
      avgMonthlyLoanPaymentsRub: number;
      revenueCv: number;
      monthsCount: number;
      annualRevenueRub: number;
    };
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<any>(`/client/applications/${id}/statement`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return (res.data as any)?.value || res.data;
  },

  getExplanation: async (id: string): Promise<{
    applicationId: string;
    status: string;
    reasonCode?: string;
    explanation: string;
    source?: string;
  }> => {
    const res = await apiClient.get<any>(`/client/applications/${id}/explanation`, { timeout: 10000 });
    return (res.data as any)?.value || res.data;
  },
};

export interface CompanyFactItem {
  month: string;
  cleanReceiptsRub: number;
  operatingOutflowRub: number;
}

export interface CompanyDebtItem {
  obligationRef?: string;
  monthlyMaxPaymentRub: number;
}

export interface CompanyLookupResponse {
  inn: string;
  ogrnip?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  registrationDate?: string;
  egripStatus?: string;
  regionCode?: string;
  regionName?: string;
  okvedMain?: string;
  okvedMainName?: string;
  taxRegime?: string;
  mspCategory?: string;
  suggestedStage: 'operating' | 'prelaunch' | string;
  isAlfaClient: boolean;
  annualRevenue?: number;
  netCashFlow?: number;
  averageMonthlyExpenses?: number;
  operatingMonths?: number;
  hasFnsBlock: boolean;
  zskRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  isBankrupt: boolean;
  phone?: string;
  email?: string;
  passportSeries?: string;
  passportNumber?: string;
  passportBirthDate?: string;
  passportIssueDate?: string;
  passportIssuer?: string;
  passportDepartmentCode?: string;
  facts?: CompanyFactItem[];
  debts?: CompanyDebtItem[];
}
