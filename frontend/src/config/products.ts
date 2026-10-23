import { CreditProductConfig, ProductCode, BusinessStage, LoanPurpose, ProductValidationResult } from '../types/products';
import { formatRubles } from '../utils/formatters';

export const CREDIT_PRODUCTS: Record<ProductCode, CreditProductConfig> = {
  WC: {
    code: 'WC',
    name: 'Оборотный кредит',
    shortName: 'Оборотный',
    category: 'Финансирование оборотных средств',
    description: 'Пополнение оборотных средств, закупка товаров и сырья, закрытие кассовых разрывов для действующего бизнеса.',
    minAmount: 100_000,
    maxAmount: 3_000_000,
    minTermMonths: 3,
    maxTermMonths: 24,
    allowedStages: ['operating'],
    allowedPurposes: ['working_capital'],
    decisionRule: 'Решает система (автоматически)',
    decisionMaker: 'system',
    minInterestRate: 18,
    maxInterestRate: 24,
    rateDescription: '18% при баллах 85+, 21% при 70–84, 24% встречное',
    minContributionPercent: () => 0,
    badgeColor: 'emerald',
  },
  EQ: {
    code: 'EQ',
    name: 'Кредит на оборудование',
    shortName: 'Оборудование',
    category: 'Инвестиции в основные средства',
    description: 'Приобретение торгового, производственного или офисного оборудования. Сумма кредита = цена оборудования минус собственный взнос.',
    minAmount: 300_000,
    maxAmount: 5_000_000,
    minTermMonths: 6,
    maxTermMonths: 48,
    allowedStages: ['operating', 'prelaunch'],
    allowedPurposes: ['equipment'],
    decisionRule: 'Operating: взнос от 10%, решает система. Prelaunch: взнос от 20%, решает сотрудник.',
    decisionMaker: 'hybrid',
    minInterestRate: 18,
    maxInterestRate: 24,
    rateDescription: '18% при баллах 85+, 21% при 70–84, 24% встречное',
    minContributionPercent: (stage: BusinessStage) => (stage === 'prelaunch' ? 20 : 10),
    badgeColor: 'blue',
  },
  START: {
    code: 'START',
    name: 'Старт (оборотные)',
    shortName: 'Старт бизнеса',
    category: 'Запуск нового бизнеса (Prelaunch)',
    description: 'Стартовые оборотные средства для индивидуальных предпринимателей на этапе запуска бизнеса до получения первой выручки.',
    minAmount: 100_000,
    maxAmount: 500_000,
    minTermMonths: 6,
    maxTermMonths: 18,
    allowedStages: ['prelaunch'],
    allowedPurposes: ['working_capital'],
    decisionRule: 'Решает сотрудник банка (ручное рассмотрение)',
    decisionMaker: 'analyst',
    minInterestRate: 18,
    maxInterestRate: 24,
    rateDescription: '18% – 24% по оценке кредитного аналитика',
    minContributionPercent: () => 0,
    badgeColor: 'purple',
  },
};

export const ALL_PRODUCTS = Object.values(CREDIT_PRODUCTS);

/**
 * Подбор кредитного продукта по 4 сценариям из спецификации (А, Б, В, Г)
 * Сценарий А: prelaunch + equipment       -> EQ (решает сотрудник)
 * Сценарий Б: prelaunch + working_capital -> START (решает сотрудник)
 * Сценарий В: operating + equipment       -> EQ (решает система)
 * Сценарий Г: operating + working_capital -> WC (решает система)
 */
export function resolveProductByScenario(
  stage: BusinessStage,
  purpose: LoanPurpose
): CreditProductConfig {
  if (purpose === 'equipment') {
    return CREDIT_PRODUCTS.EQ;
  }
  if (stage === 'operating') {
    return CREDIT_PRODUCTS.WC;
  }
  return CREDIT_PRODUCTS.START;
}

/**
 * Валидация параметров заявки под требования выбранного продукта.
 * В соответствии со спецификацией: "Если продукт не подходит, показываем причину
 * и возвращаем к подбору. Это не кредитный отказ."
 */
export function validateProductParameters(
  productCode: ProductCode,
  stage: BusinessStage,
  amount: number,
  termMonths: number,
  ownContribution: number = 0,
  equipmentPrice?: number
): ProductValidationResult {
  const config = CREDIT_PRODUCTS[productCode];
  if (!config) {
    return { isValid: false, errorMessage: 'Неизвестный кредитный продукт' };
  }

  // 1. Проверка соответствия стадии бизнеса
  if (!config.allowedStages.includes(stage)) {
    if (stage === 'prelaunch' && productCode === 'WC') {
      return {
        isValid: false,
        errorCode: 'STAGE_MISMATCH',
        errorMessage: 'Продукт «Оборотный кредит (WC)» доступен только действующему бизнесу. Для нового бизнеса выберите продукт «Старт (START)».',
        suggestedProductCode: 'START',
      };
    }
    return {
      isValid: false,
      errorCode: 'STAGE_MISMATCH',
      errorMessage: `Продукт ${config.name} не доступен для стадии бизнеса «${stage === 'operating' ? 'Действующий' : 'Prelaunch'}»`,
    };
  }

  // 2. Проверка лимитов суммы
  if (amount > config.maxAmount) {
    return {
      isValid: false,
      errorCode: 'PRODUCT_NA_AMOUNT',
      errorMessage: `Для вашего этапа бизнеса максимальная сумма по продукту ${config.name} (${config.code}) составляет ${formatRubles(config.maxAmount)}. Измените сумму или цель.`,
    };
  }

  if (amount < config.minAmount) {
    return {
      isValid: false,
      errorCode: 'PRODUCT_NA_AMOUNT',
      errorMessage: `Минимальная сумма по продукту ${config.name} (${config.code}) — ${formatRubles(config.minAmount)}.`,
    };
  }

  // 3. Проверка первоначального взноса для кредита на оборудование (EQ)
  if (productCode === 'EQ' && equipmentPrice && equipmentPrice > 0) {
    const requiredPercent = config.minContributionPercent(stage);
    const minRequiredContribution = Math.round((equipmentPrice * requiredPercent) / 100);

    if (ownContribution < minRequiredContribution) {
      const deficit = minRequiredContribution - ownContribution;
      return {
        isValid: false,
        errorCode: 'CONTRIBUTION_LOW',
        errorMessage: `Нужен взнос от ${requiredPercent}% (${formatRubles(minRequiredContribution)}). Вам не хватает ${formatRubles(deficit)}.`,
      };
    }
  }

  return { isValid: true };
}
