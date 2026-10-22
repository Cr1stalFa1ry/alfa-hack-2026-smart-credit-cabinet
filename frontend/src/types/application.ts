import { ScoringResult } from './scoring';

export type ApplicationStatus =
  | 'draft'          // T01, T02: Создана, заполняется клиентом
  | 'checking'       // T03, T06, T10, T14: Автопроверка и расчет скоринга
  | 'waiting_check'  // T05: Внешний сервис недоступен (503 SOURCE_UNAVAILABLE)
  | 'need_info'      // T04, T11, T15: Запрос дополнительных документов/пояснений
  | 'review'         // T07: Направлена аналитику банка на ручной разбор
  | 'offer'          // T08, T12: Одобрено банком, сформирована оферта
  | 'declined'       // T09, T13: Отказ (по правилу или аналитиком)
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
  | 'T17';// Клиент: отозвать заявку (any -> closed)

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
  status: 'uploaded' | 'verified' | 'rejected';
}

export interface CreditApplication {
  id: string;
  inn: string;
  companyName: string;
  businessType: BusinessType;
  requestedAmount: number;
  requestedTermMonths: number;
  purpose: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  documents: UploadedDocument[];
  needInfoPrompt?: string;
  needInfoResponse?: string;
  declineReason?: string;
  offer?: CreditOffer;
  scoring?: ScoringResult;
  history: StateTransitionRecord[];
}

export interface CreateDraftRequest {
  inn: string;
  companyName?: string;
  businessType: BusinessType;
  requestedAmount: number;
  requestedTermMonths: number;
  purpose: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
}
