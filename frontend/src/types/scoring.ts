export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface StopFactorItem {
  id: string;
  code: string;
  title: string;
  description: string;
  isTriggered: boolean;
  severity: 'warning' | 'critical';
}

export interface EgripCompany {
  inn: string;
  ogrnip: string;
  fullName: string;
  status: 'ACTIVE' | 'LIQUIDATED' | 'BANKRUPT';
  registrationDate: string;
  okved: string;
  okvedName: string;
  region: string;
}

export interface BkiReport {
  rating: number; // 300 - 850
  activeLoansCount: number;
  totalDebt: number;
  maxOverdueDays: number;
  currentOverdueAmount: number;
  hasCriticalDelays: boolean;
}

export interface FnsReport {
  taxDebtAmount: number;
  hasSuspendedAccounts: boolean;
  isDisqualifiedPerson: boolean;
  lastReportingSubmitted: boolean;
}

export interface ScoringResult {
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  dscr: number; // Debt Service Coverage Ratio
  netCashFlow: number;
  recommendedMaxPayment: number;
  stopFactors: StopFactorItem[];
  egrip: EgripCompany;
  bki: BkiReport;
  fns: FnsReport;
  calculatedAt: string;
}
