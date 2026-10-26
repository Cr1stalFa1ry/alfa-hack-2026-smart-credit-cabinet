import { ScoringResult } from './scoring';
import { ProductCode, BusinessStage, LoanPurpose } from './products';

export type ApplicationStatus =
  | 'draft'          // T01, T02: Создана, заполняется клиентом
  | 'checking'       // T03, T06, T10, T14: Автопроверка и расчет скоринга
  | 'waiting_check'  // T05: Внешний сервис недоступен (503 SOURCE_UNAVAILABLE)
  | 'need_info'      // T04, T11, T15: Запрос дополнительных документов/пояснений
  | 'review'         // T07: Направлена аналитику банка на ручной разбор
  | 'offer'          // T08, T12: Одобрено банком, сформирована оферта
  | 'declined'       // T09, T13: Отказ (по правилу или аналитиком)
  | 'accepted'       // T21: Клиент принял оферту
  | 'signed_sim'     // T22: Договор подписан ЭЦП (симуляция)
  | 'disbursed_sim'  // T23: Кредит выдан, средства на счёте
  | 'closed';        // T16 (некредитное препятствие) или T17 (отзыв клиентом)

export type BusinessType = 'operating' | 'prelaunch';

export type ActorRole = 'client' | 'system' | 'analyst';

export type TransitionCode =
  | 'T01' // Создать черновик (draft)
  | 'T02' // Сохранить черновик
  | 'T03' // Отправить заявку (draft -> checking)
  | 'T04' // Скоринг: нужны сведения (checking -> need_info)
  | 'T05' // Интеграция 503 (checking -> waiting_check)
  | 'T06' // Повторить проверку (waiting_check -> checking)
  | 'T07' // Скоринг: передать аналитику (checking -> review)
  | 'T08' // Скоринг: авто-одобрение (checking -> offer)
  | 'T09' // Скоринг: авто-отказ по правилу (checking -> declined)
  | 'T10' // Клиент: ответ на запрос (need_info -> checking)
  | 'T11' // Аналитик: запросить сведения (review -> need_info)
  | 'T12' // Аналитик: одобрить оферту (review -> offer)
  | 'T13' // Аналитик: отказать с причиной (review -> declined)
  | 'T14' // Аналитик: факты уточнены (review -> checking)
  | 'T15' // Повторный скоринг: нужны сведения (checking -> need_info)
  | 'T16' // Некредитное препятствие (checking/review -> closed)
  | 'T17' // Клиент: отозвать заявку (any -> closed)
  | 'T21' // Клиент: принять оферту (offer -> accepted)
  | 'T22' // Клиент: подписать договор ЭЦП (accepted -> signed_sim)
  | 'T23';// Система: выдать средства на счет (signed_sim -> disbursed_sim)

export interface StateTransitionRecord {
  id: string;
  transitionCode: TransitionCode;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  actor: ActorRole;
  actorName: string;
  reasonCode?: string;
  comment?: string;
  timestamp: string;
  files?: UploadedDocument[];
}

export interface CreditOffer {
  approvedAmount: number;
  approvedTermMonths: number;
  annualInterestRate: number; // e.g. 14.5%
  monthlyPayment: number;
  totalRepayment: number;
  expirationDate: string;
  alternativeTerms?: {
    additionalMonths: number;
    newTermMonths: number;
    newMonthlyPayment: number;
    note: string;
  };
  isAccepted?: boolean;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileType: 'bank_statement' | 'tax_declaration' | 'contract' | 'other';
  uploadedAt: string;
  status: 'uploaded' | 'verified' | 'rejected' | 'superseded';
  downloadUrl?: string;
  fileKey?: string;
  review?: 'pending' | 'verified' | 'rejected' | 'superseded';
  reviewedAt?: string;
  reviewNote?: string;
  group?: string;
  evidenceGroup?: string;
  replacementForGroup?: string;
  supersededBy?: string;
  size?: number;
  mime?: string;
}

export interface ClientRequestItem {
  id: string;
  title: string;
  reason: string;
  documentType?: string;
  period?: string;
  documentPurpose?: string;
  status: 'open' | 'responded' | 'closed';
  createdAt: string;
  respondedAt?: string;
  response?: string;
  draftResponse?: string;
  files?: UploadedDocument[];
}

export interface CreditApplication {
  id: string;
  inn: string;
  companyName: string;
  clientName?: string;
  productCode?: ProductCode; // 'EQ' | 'WC' | 'START'
  stage?: BusinessStage;
  businessType: BusinessType;
  purposeCode?: LoanPurpose;
  purpose: string;
  requestedAmount: number;
  ownContribution?: number;
  equipmentPrice?: number;
  equipmentSupplier?: string;
  equipmentList?: string;
  requestedTermMonths: number;
  neededByDate?: string;
  asSoonAsPossible?: boolean;
  expensePeriod?: string;
  hasContract?: string;
  hasExpenseContract?: boolean;
  isTaxRegimeActual?: boolean;
  declaredTaxRegime?: string;
  receiptCoverage?: string[];
  expensesCoverageStatus?: string;
  hasAdditionalIncome?: boolean;
  additionalIncomeAmount?: number;
  debtsVerificationStatus?: string;
  repaymentSourceDescription?: string;
  householdExpenses?: number;
  existingMonthlyObligations?: number;
  bkiConsent?: boolean;
  bkiConsentDate?: string;
  bkiConsentValidUntil?: string;
  personalDataConsent?: boolean;
  personalDataConsentDate?: string;
  leasingPartnerConsent?: boolean;
  leasingPartnerName?: string;
  leasingPartnerConsentDate?: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  documents: UploadedDocument[];
  files?: Record<string, UploadedDocument[]>;
  needInfoPrompt?: string;
  needInfoResponse?: string;
  needInfoRequestedAt?: string;
  needInfoActorName?: string;
  needInfoFiles?: UploadedDocument[];
  declineReason?: string;
  reasonCodes?: string[];
  offer?: CreditOffer;
  recommendedOffer?: CreditOffer;
  currentOffer?: any;
  manualOffer?: {
    amount: number | string;
    term: number | string;
    rate: number | string;
    payment: number | string;
    description: string;
    analysisFingerprint?: number | string;
    rulesVersion?: string;
  };
  scoring?: ScoringResult;
  mlExplanation?: string;
  mlExplanationSource?: string;
  history: StateTransitionRecord[];
  events?: Array<{
    at: string;
    actor: string;
    public: boolean;
    text: string;
  }>;
  requests?: ClientRequestItem[];
  checks?: {
    identity?: 'pending' | 'verified' | 'issue';
    finances?: 'pending' | 'verified' | 'issue';
    supplier?: 'pending' | 'verified' | 'issue';
    property?: 'pending' | 'verified' | 'issue';
    [key: string]: 'pending' | 'verified' | 'issue' | undefined;
  };
  scoringOverrides?: {
    debtPayment?: string | null;
    extraExpenses?: string | null;
    debtReconciled?: boolean;
    extraExpensesConfirmed?: boolean;
    ownFundsConfirmed?: boolean;
    taxConfirmed?: boolean;
    note?: string;
    at?: string;
    actor?: string;
  };
  offerReviewFingerprint?: number | string | null;
  analysis?: any;
  analysisHistory?: any[];
  clientAnswers?: Record<string, any>;
  specialistNotes?: string[];
  scenario?: string;
  submissionPayload?: any;
  issues?: string[];
}

export interface CreateDraftRequest {
  inn: string;
  companyName?: string;
  productCode?: ProductCode;
  stage?: BusinessStage;
  businessType: BusinessType;
  purposeCode?: LoanPurpose;
  requestedAmount: number;
  ownContribution?: number;
  equipmentPrice?: number;
  equipmentSupplier?: string;
  requestedTermMonths: number;
  neededByDate?: string;
  asSoonAsPossible?: boolean;
  expensePeriod?: string;
  hasContract?: string;
  hasExpenseContract?: boolean;
  isTaxRegimeActual?: boolean;
  declaredTaxRegime?: string;
  receiptCoverage?: string[];
  expensesCoverageStatus?: string;
  hasAdditionalIncome?: boolean;
  additionalIncomeAmount?: number;
  debtsVerificationStatus?: string;
  repaymentSourceDescription?: string;
  householdExpenses?: number;
  existingMonthlyObligations?: number;
  bkiConsent?: boolean;
  bkiConsentDate?: string;
  personalDataConsent?: boolean;
  personalDataConsentDate?: string;
  leasingPartnerConsent?: boolean;
  leasingPartnerName?: string;
  leasingPartnerConsentDate?: string;
  purpose: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  clientAnswers?: Record<string, any>;
  specialistNotes?: string[];
  scenario?: string;
  submissionPayload?: any;
  issues?: string[];
}
