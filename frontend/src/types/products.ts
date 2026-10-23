export type ProductCode = 'EQ' | 'WC' | 'START';
export type BusinessStage = 'operating' | 'prelaunch';
export type LoanPurpose = 'equipment' | 'working_capital';

export interface CreditProductConfig {
  code: ProductCode;
  name: string;
  shortName: string;
  category: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  allowedStages: BusinessStage[];
  allowedPurposes: LoanPurpose[];
  decisionRule: string; // "решает система" или "решает сотрудник"
  decisionMaker: 'system' | 'analyst' | 'hybrid';
  minInterestRate: number;
  maxInterestRate: number;
  rateDescription: string;
  minContributionPercent: (stage: BusinessStage) => number;
  badgeColor: string;
}

export interface ProductValidationResult {
  isValid: boolean;
  errorCode?: 'PRODUCT_NA_AMOUNT' | 'CONTRIBUTION_LOW' | 'STAGE_MISMATCH' | 'PURPOSE_MISMATCH';
  errorMessage?: string;
  suggestedProductCode?: ProductCode;
}
