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
    clientAnswers: item.clientAnswers,
    specialistNotes: item.specialistNotes,
    scenario: item.scenario,
    submissionPayload: item.submissionPayload,
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
    needInfoPrompt: item.needInfoPrompt,
    needInfoResponse: item.needInfoResponse,
    issues: item.issues || (item.scoring?.issues) || [],
    scoring: item.scoring,
    mlExplanation: item.mlExplanation,
    mlExplanationSource: item.mlExplanationSource,
    reasonCodes: item.reasonCodes || [],
    declineReason: item.declineReason,
    currentOffer: item.currentOffer,
    recommendedOffer: (item.currentOffer || item.offer) ? {
      approvedAmount: Number(item.currentOffer?.approvedAmount || item.offer?.approvedAmount || item.requestedAmount),
      approvedTermMonths: Number(item.currentOffer?.termMonths || item.offer?.approvedTermMonths || 12),
      annualInterestRate: Number(item.currentOffer?.annualRatePercent || item.offer?.annualInterestRate || 18.5),
      monthlyPayment: Number(item.currentOffer?.monthlyPayment || item.offer?.monthlyPayment || 0),
      totalRepayment: Number(item.currentOffer?.totalRepayment || (item.currentOffer?.monthlyPayment ? item.currentOffer.monthlyPayment * (item.currentOffer.termMonths || 12) : 0) || item.offer?.totalRepayment || 0),
      expirationDate: item.currentOffer?.expirationDate || item.offer?.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      alternativeTerms: item.offer?.alternativeTerms,
      isAccepted: item.offer?.isAccepted || false,
    } : undefined,
    offer: ['offer', 'accepted', 'signed_sim', 'disbursed_sim', 'pre_conditions', 'ready_to_disburse'].includes(normalizeStatus(item.status)) && (item.currentOffer || item.offer) ? {
      approvedAmount: Number(item.currentOffer?.approvedAmount || item.offer?.approvedAmount || item.requestedAmount),
      approvedTermMonths: Number(item.currentOffer?.termMonths || item.offer?.approvedTermMonths || 12),
      annualInterestRate: Number(item.currentOffer?.annualRatePercent || item.offer?.annualInterestRate || 18.5),
      monthlyPayment: Number(item.currentOffer?.monthlyPayment || item.offer?.monthlyPayment || 0),
      totalRepayment: Number(item.currentOffer?.totalRepayment || (item.currentOffer?.monthlyPayment ? item.currentOffer.monthlyPayment * (item.currentOffer.termMonths || 12) : 0) || item.offer?.totalRepayment || 0),
      expirationDate: item.currentOffer?.expirationDate || item.offer?.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      alternativeTerms: item.offer?.alternativeTerms,
      isAccepted: item.offer?.isAccepted || false,
    } : undefined,
  };
}

export const clientApi = {
  getMyApplications: async (): Promise<CreditApplication[]> => {
    try {
      const res = await apiClient.get<any>('/client/applications', { timeout: 4000 });
      const data = (res.data as any)?.value || res.data;
      if (Array.isArray(data)) {
        const mapped = data
          .map(mapBackendApplication)
          .filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO'));
        applicationStore.syncApps(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend client applications unavailable, using local store:', err);
      return applicationStore.getAll().filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO'));
    }
    return [];
  },

  getApplicationById: async (id: string): Promise<CreditApplication> => {
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
    if (local) return local;
    throw new Error('Заявка не найдена');
  },

  createDraft: async (data: CreateDraftRequest): Promise<CreditApplication> => {
    const stage = data.stage || (data.businessType === 'prelaunch' ? 'prelaunch' : 'operating');
    const purposeCode = data.purposeCode || (data.purpose?.toLowerCase().includes('оборудован') ? 'equipment' : 'working_capital');
    const productCode = data.productCode || (purposeCode === 'equipment' ? 'EQ' : (stage === 'prelaunch' ? 'START' : 'WC'));

    const res = await apiClient.post<any>('/client/applications/draft', {
      inn: data.inn,
      stage: stage === 'prelaunch' ? 2 : 1,
      purpose: purposeCode === 'equipment' ? 1 : 2,
      productCode,
      requestedAmount: data.requestedAmount,
      ownContribution: data.ownContribution || 0,
      requestedTermMonths: data.requestedTermMonths,
      bkiConsent: data.bkiConsent ?? false,
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
    const res = await apiClient.put<any>(`/client/applications/${id}/draft`, {
      requestedAmount: data.requestedAmount || 0,
      ownContribution: data.ownContribution || 0,
      requestedTermMonths: data.requestedTermMonths,
      bkiConsent: data.bkiConsent ?? true,
      personalDataConsent: data.personalDataConsent ?? true,
      productCode: data.productCode,
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
    try {
      await apiClient.post<any>(`/client/applications/${id}/respond-info`, {
        responseComment: response,
      }, { timeout: 5000 });
    } catch (err) {
      console.warn('Backend respond-info error (handled offline):', err);
    }
    const app = applicationStore.getById(id);
    const openReq = app?.requests?.find((r) => r.status === 'open');
    if (openReq) {
      applicationStore.replyClientRequest(id, openReq.id, response, files);
    } else {
      applicationStore.setStatus(id, 'checking', `Ответ клиента: ${response}`);
    }
    return applicationStore.getById(id)!;
  },

  replyNeedInfo: async (id: string, response: string, files?: UploadedDocument[]): Promise<CreditApplication> => {
    return clientApi.respondNeedInfo(id, response, files);
  },

  acceptOffer: async (id: string, useAlternative?: boolean): Promise<CreditApplication> => {
    const res = await apiClient.post<any>(`/client/applications/${id}/accept-offer`, {
      useAlternative: Boolean(useAlternative),
    });
    const resData = (res.data as any)?.value || res.data;
    return mapBackendApplication(resData);
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

  uploadDocument: async (id: string, file: File): Promise<UploadedDocument> => {
    const fileType = file.name.endsWith('.pdf') ? 'bank_statement' : 'other';
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
