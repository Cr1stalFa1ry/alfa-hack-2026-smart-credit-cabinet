import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../../api/clientApi';
import { egripApi } from '../../api/egripApi';
import { EgripCompany } from '../../types/scoring';
import { BusinessType } from '../../types/application';
import { ProductCode } from '../../types/products';
import { CREDIT_PRODUCTS, ALL_PRODUCTS } from '../../config/products';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { FileUpload } from '../../components/common/FileUpload';
import { Alert } from '../../components/common/Alert';
import { EgripCard } from '../../components/application/EgripCard';
import { ConsentModal, ConsentType } from '../../components/application/ConsentModal';
import { ProductCodeBadge } from '../../components/badges/ProductCodeBadge';
import { formatRubles } from '../../utils/formatters';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Check,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  Wrench,
  Calculator,
  Info,
  Sparkles,
  FileText,
  UserCheck,
  Cpu,
} from 'lucide-react';

export const NewApplicationWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard steps: 1 = ИНН, стадия и продукт; 2 = Параметры и финансы; 3 = Документы и отправка
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  // ----------------------------------------------------
  // Шаг 1: ИНН, стадия бизнеса и выбор продукта
  // ----------------------------------------------------
  const [inn, setInn] = useState('770123456789');
  const [egripCompany, setEgripCompany] = useState<EgripCompany | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType>('operating');
  const [productCode, setProductCode] = useState<ProductCode>('WC');

  // ----------------------------------------------------
  // Шаг 2: Параметры кредитования
  // ----------------------------------------------------
  const [amount, setAmount] = useState<number>(1500000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [helpWithTerm, setHelpWithTerm] = useState<boolean>(false);
  const [purpose, setPurpose] = useState('Пополнение оборотных средств и закупка товаров');

  // Специфика EQ (Оборудование)
  const [equipmentList, setEquipmentList] = useState('Производственное и торговое оборудование');
  const [equipmentPrice, setEquipmentPrice] = useState<number>(2500000);
  const [ownContribution, setOwnContribution] = useState<number>(500000);
  const [supplierStatus, setSupplierStatus] = useState<'chosen' | 'searching'>('chosen');
  const [equipmentSupplier, setEquipmentSupplier] = useState('ООО «СтанкоПром» (ИНН 7701987654)');

  // Финансы действующего бизнеса (operating)
  const [revenue, setRevenue] = useState<number>(750000);
  const [expenses, setExpenses] = useState<number>(380000);

  // Финансы нового бизнеса (prelaunch) — источники покрытия долга
  const [repaymentSources, setRepaymentSources] = useState<string[]>(['salary', 'savings']);
  const [alternateIncome, setAlternateIncome] = useState<number>(150000);
  const [incomeKept, setIncomeKept] = useState<'yes' | 'no' | 'unsure'>('yes');
  const [savingsAmount, setSavingsAmount] = useState<number>(600000);
  const [collateralType, setCollateralType] = useState<'own' | 'third_party' | 'shared'>('own');
  const [collateralAddress, setCollateralAddress] = useState('');
  const [collateralClean, setCollateralClean] = useState(true);

  // ----------------------------------------------------
  // Шаг 3: Документы и согласия
  // ----------------------------------------------------
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [attachLater, setAttachLater] = useState<boolean>(false);
  const [pdnConsent, setPdnConsent] = useState<boolean>(true);
  const [bkiConsent, setBkiConsent] = useState<boolean>(true);
  const [leasingConsent, setLeasingConsent] = useState<boolean>(true);
  const [activeConsentModal, setActiveConsentModal] = useState<ConsentType | null>(null);

  // Конфигурация текущего выбранного продукта
  const currentProductConfig = CREDIT_PRODUCTS[productCode];

  // Проверка ЕГРИП по ИНН
  const handleCheckInn = async () => {
    if (inn.length >= 10) {
      setIsLoading(true);
      try {
        const company = await egripApi.getCompanyByInn(inn);
        setEgripCompany(company);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Переключение стадии бизнеса со сбалансированным подбором продукта
  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'prelaunch') {
      if (productCode === 'WC') {
        setProductCode('START');
        setAmount(400000);
        setTermMonths(12);
        setPurpose('Стартовые оборотные средства для запуска нового направления');
      } else if (productCode === 'EQ') {
        // Минимальный взнос для prelaunch 20%
        const minOwn = Math.round(equipmentPrice * 0.2);
        if (ownContribution < minOwn) {
          setOwnContribution(minOwn);
          setAmount(equipmentPrice - minOwn);
        }
      }
    } else {
      // operating
      if (productCode === 'START') {
        setProductCode('WC');
        setAmount(1500000);
        setTermMonths(12);
        setPurpose('Пополнение оборотных средств и закупка товаров');
      }
    }
  };

  // Выбор продукта клиентом
  const handleSelectProduct = (code: ProductCode) => {
    setProductCode(code);
    const cfg = CREDIT_PRODUCTS[code];

    if (code === 'EQ') {
      const defaultPrice = 2500000;
      const minPercent = businessType === 'prelaunch' ? 20 : 10;
      const defaultOwn = Math.round((defaultPrice * minPercent) / 100);
      setEquipmentPrice(defaultPrice);
      setOwnContribution(defaultOwn);
      setAmount(defaultPrice - defaultOwn);
      setPurpose(`Кредит на приобретение оборудования: ${equipmentList}`);
    } else if (code === 'START') {
      setAmount(Math.min(amount, cfg.maxAmount));
      setPurpose('Стартовые оборотные средства для запуска бизнеса');
    } else {
      // WC
      setAmount(Math.min(Math.max(amount, cfg.minAmount), cfg.maxAmount));
      setPurpose('Пополнение оборотных средств и закупка товаров/сырья');
    }
  };

  // Автоматический пересчет суммы кредита при изменении цены оборудования
  const handleEquipmentPriceChange = (price: number) => {
    setEquipmentPrice(price);
    const calculatedAmount = Math.max(0, price - ownContribution);
    setAmount(calculatedAmount);
  };

  // Автоматический пересчет суммы кредита при изменении взноса
  const handleOwnContributionChange = (own: number) => {
    setOwnContribution(own);
    const calculatedAmount = Math.max(0, equipmentPrice - own);
    setAmount(calculatedAmount);
  };

  // Проверка сходимости для EQ: Стоимость - Взнос = Сумма кредита
  const eqExpectedAmount = Math.max(0, equipmentPrice - ownContribution);
  const eqIsMismatched = productCode === 'EQ' && Math.abs(amount - eqExpectedAmount) > 1;

  // Проверка минимального процента взноса для EQ
  const requiredContributionPercent = businessType === 'prelaunch' ? 20 : 10;
  const minRequiredContribution = Math.round((equipmentPrice * requiredContributionPercent) / 100);
  const isContributionLow = productCode === 'EQ' && ownContribution < minRequiredContribution;

  // Переключение источников погашения для prelaunch
  const toggleRepaymentSource = (sourceKey: string) => {
    setRepaymentSources((prev) =>
      prev.includes(sourceKey) ? prev.filter((s) => s !== sourceKey) : [...prev, sourceKey]
    );
  };

  const handleFileUpload = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  // Финальная отправка заявки (T01 сохранить черновик или T03 отправить в банк)
  const handleSubmit = async (submitImmediately: boolean) => {
    setIsLoading(true);
    try {
      const specialistNotes: string[] = [];

      if (helpWithTerm) {
        specialistNotes.push('Клиенту требуется помощь аналитика с подбором комфортного срока и графика платежей.');
      }
      if (attachLater) {
        specialistNotes.push('Клиент выбрал отложенное предоставление документов (будут приложены по запросу T11/need_info).');
      }
      if (businessType === 'prelaunch') {
        const sourceDescriptions: Record<string, string> = {
          salary: `Работа по найму (${formatRubles(alternateIncome)}/мес, доход сохранится: ${
            incomeKept === 'yes' ? 'да' : incomeKept === 'no' ? 'нет' : 'не уверен'
          })`,
          savings: `Накопления/подушка безопасности (${formatRubles(savingsAmount)})`,
          rent_other: `Аренда или другой действующий бизнес (${formatRubles(alternateIncome)}/мес)`,
          collateral: `Залог недвижимости (${collateralType === 'own' ? 'собственность ИП' : 'третье лицо'}, ${
            collateralAddress || 'адрес по запросу'
          })`,
          future_revenue: 'Прогноз будущей выручки (ручное рассмотрение)',
        };
        const sourcesSummary = repaymentSources.map((s) => sourceDescriptions[s] || s).join('; ');
        specialistNotes.push(`Prelaunch источники покрытия долга: ${sourcesSummary}`);
      }
      if (productCode === 'EQ') {
        const percent = Math.round((ownContribution / (equipmentPrice || 1)) * 100);
        specialistNotes.push(
          `EQ Оборудование: «${equipmentList}», полная стоимость ${formatRubles(
            equipmentPrice
          )}, взнос ${formatRubles(ownContribution)} (${percent}%). Поставщик: ${
            supplierStatus === 'chosen' ? equipmentSupplier : 'Не выбран (нужна помощь с подбором)'
          }`
        );
      }

      const clientAnswers: Record<string, any> = {
        productCode,
        businessType,
        helpWithTerm,
        attachLater,
        repaymentSources: businessType === 'prelaunch' ? repaymentSources : undefined,
        alternateIncome: businessType === 'prelaunch' ? alternateIncome : undefined,
        incomeKept: businessType === 'prelaunch' ? incomeKept : undefined,
        savingsAmount: businessType === 'prelaunch' ? savingsAmount : undefined,
        collateralType:
          businessType === 'prelaunch' && repaymentSources.includes('collateral')
            ? collateralType
            : undefined,
        collateralAddress:
          businessType === 'prelaunch' && repaymentSources.includes('collateral')
            ? collateralAddress
            : undefined,
        equipmentList: productCode === 'EQ' ? equipmentList : undefined,
        equipmentPrice: productCode === 'EQ' ? equipmentPrice : undefined,
        ownContribution: productCode === 'EQ' ? ownContribution : undefined,
        equipmentSupplier:
          productCode === 'EQ' && supplierStatus === 'chosen' ? equipmentSupplier : undefined,
      };

      const finalPurpose =
        productCode === 'EQ'
          ? `Кредит на оборудование: ${equipmentList}`
          : purpose;

      const draft = await clientApi.createDraft({
        inn,
        companyName: egripCompany?.fullName,
        productCode,
        stage: businessType,
        businessType,
        purposeCode: productCode === 'EQ' ? 'equipment' : 'working_capital',
        requestedAmount: Number(amount),
        requestedTermMonths: Number(termMonths),
        equipmentPrice: productCode === 'EQ' ? Number(equipmentPrice) : undefined,
        ownContribution: productCode === 'EQ' ? Number(ownContribution) : 0,
        equipmentSupplier:
          productCode === 'EQ' && supplierStatus === 'chosen' ? equipmentSupplier : undefined,
        purpose: finalPurpose,
        monthlyRevenue: businessType === 'operating' ? Number(revenue) : 0,
        monthlyExpenses: businessType === 'operating' ? Number(expenses) : 0,
        bkiConsent,
        personalDataConsent: pdnConsent,
        leasingPartnerConsent:
          productCode === 'EQ' && businessType === 'prelaunch' ? leasingConsent : undefined,
        leasingPartnerName: 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
        clientAnswers,
        specialistNotes,
      });

      // Прикрепляем загруженные файлы к заявке
      for (const file of uploadedFiles) {
        await clientApi.uploadDocument(draft.id, file);
      }

      if (submitImmediately) {
        await clientApi.submitApplication(draft.id);
      }

      navigate(`/client/applications/${draft.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Шапка визарда */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/client/dashboard')}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Оформление кредита для бизнеса
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Шаг {currentStep} из 3 • Автоматический подбор продукта, проверка ЕГРИП и скоринг
          </p>
        </div>
      </div>

      {/* Индикатор этапов */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { step: 1, title: '1. ИП и продукт' },
          { step: 2, title: '2. Параметры и финансы' },
          { step: 3, title: '3. Документы и отправка' },
        ].map((s) => (
          <div key={s.step} className="space-y-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                currentStep >= s.step ? 'bg-alfa-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <span
              className={`text-[11px] font-semibold block truncate ${
                currentStep >= s.step
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* ШАГ 1: ИП, СТАДИЯ БИЗНЕСА И ВЫБОР ПРОДУКТА            */}
      {/* ---------------------------------------------------- */}
      {currentStep === 1 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Шаг 1. Данные предпринимателя и выбор кредитного продукта
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Укажите ИНН для получения регистрационной карточки и выберите подходящую программу
            </p>
          </div>

          {/* ИНН и ЕГРИП */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="ИНН предпринимателя (12 цифр)"
                placeholder="770123456789"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                maxLength={12}
                helperText="Тестовые ИНН: 770123456789, 500198765432, 780911223344"
              />
            </div>
            <div className="sm:self-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCheckInn}
                isLoading={isLoading}
              >
                Проверить ЕГРИП
              </Button>
            </div>
          </div>

          {/* Карточка ЕГРИП */}
          {egripCompany && <EgripCard company={egripCompany} />}

          {/* Стадия бизнеса (Ветвление сценария) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Стадия бизнеса
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleBusinessTypeChange('operating')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  businessType === 'operating'
                    ? 'border-alfa-500 bg-alfa-50/40 dark:bg-alfa-950/30 ring-2 ring-alfa-200 dark:ring-alfa-900'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Действующий бизнес
                  </span>
                  {businessType === 'operating' && <Check className="w-4 h-4 text-alfa-600" />}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Бизнес уже ведёт деятельность и получает стабильную выручку (доступны Оборотный и Оборудование)
                </span>
              </div>

              <div
                onClick={() => handleBusinessTypeChange('prelaunch')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  businessType === 'prelaunch'
                    ? 'border-alfa-500 bg-alfa-50/40 dark:bg-alfa-950/30 ring-2 ring-alfa-200 dark:ring-alfa-900'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Новый бизнес (Prelaunch)
                  </span>
                  {businessType === 'prelaunch' && <Check className="w-4 h-4 text-alfa-600" />}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Только готовитесь к запуску или менее 6–12 месяцев без регулярных поступлений (доступны Старт и Оборудование)
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* СЦЕНАРИЙ 2: ВЫБОР ПРОДУКТА ИЗ products.ts             */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Выберите кредитный продукт
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Программы Альфа-Банка, оптимизированные под выбранный этап развития бизнеса
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Всего: {ALL_PRODUCTS.length} продукта
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ALL_PRODUCTS.map((prod) => {
                const isSelected = productCode === prod.code;
                const isAllowedForStage = prod.allowedStages.includes(businessType);

                return (
                  <div
                    key={prod.code}
                    onClick={() => {
                      if (isAllowedForStage) {
                        handleSelectProduct(prod.code);
                      }
                    }}
                    className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      !isAllowedForStage
                        ? 'opacity-50 grayscale cursor-not-allowed border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                        : isSelected
                        ? 'border-alfa-500 ring-2 ring-alfa-300 dark:ring-alfa-800 bg-alfa-50/20 dark:bg-alfa-950/20 cursor-pointer shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <ProductCodeBadge code={prod.code} size="sm" />
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-alfa-600 dark:text-alfa-400 bg-alfa-50 dark:bg-alfa-950 px-2 py-0.5 rounded-full border border-alfa-200 dark:border-alfa-800">
                            <Check className="w-3 h-3 stroke-[3]" /> Выбран
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {prod.description}
                        </p>
                      </div>

                      {/* Лимиты */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Сумма:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            до {formatRubles(prod.maxAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Срок:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {prod.minTermMonths}–{prod.maxTermMonths} мес.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                      {isAllowedForStage ? (
                        <span className="flex items-center gap-1">
                          {prod.decisionMaker === 'system' ? (
                            <Cpu className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-purple-500" />
                          )}
                          {prod.decisionRule}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          {businessType === 'prelaunch'
                            ? 'Только для действующего бизнеса'
                            : 'Только на этапе запуска бизнеса'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Далее к параметрам финансирования
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* ШАГ 2: ПАРАМЕТРЫ ФИНАНСИРОВАНИЯ И ФИНАНСЫ             */}
      {/* ---------------------------------------------------- */}
      {currentStep === 2 && (
        <Card className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Шаг 2. Параметры кредитования и финансовое обеспечение
                </h2>
                <ProductCodeBadge code={productCode} size="sm" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Программа «{currentProductConfig.name}» • Лимит от {formatRubles(currentProductConfig.minAmount)} до {formatRubles(currentProductConfig.maxAmount)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-alfa-600 dark:text-alfa-400 hover:underline font-semibold"
            >
              Сменить продукт
            </button>
          </div>

          {/* ---------------------------------------------------- */}
          {/* СЦЕНАРИЙ 3: ДЛЯ EQ (ОБОРУДОВАНИЕ) — ВЗНОС И СХОДИМОСТЬ */}
          {/* ---------------------------------------------------- */}
          {productCode === 'EQ' ? (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Параметры приобретаемого оборудования и собственный взнос
                </h3>
              </div>

              <Input
                label="Наименование или категория оборудования"
                value={equipmentList}
                onChange={(e) => setEquipmentList(e.target.value)}
                placeholder="Например: Фрезерный станок с ЧПУ, Кофейный аппарат, Торговая витрина"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Полная стоимость оборудования (₽)"
                    type="number"
                    step="50000"
                    min="300000"
                    value={equipmentPrice}
                    onChange={(e) => handleEquipmentPriceChange(Number(e.target.value))}
                    helperText={`Стоимость покупки: ${formatRubles(equipmentPrice)}`}
                  />
                </div>

                <div>
                  <Input
                    label={`Собственный первоначальный взнос (мин. ${requiredContributionPercent}%)`}
                    type="number"
                    step="20000"
                    min="0"
                    value={ownContribution}
                    onChange={(e) => handleOwnContributionChange(Number(e.target.value))}
                    helperText={`Ваш вклад: ${formatRubles(ownContribution)} (${Math.round(
                      (ownContribution / (equipmentPrice || 1)) * 100
                    )}%)`}
                  />
                </div>
              </div>

              {/* Предупреждение о недостаточном взносе */}
              {isContributionLow && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Минимальный взнос не достигнут: </strong>
                    Для этапа «{businessType === 'prelaunch' ? 'Prelaunch (новый)' : 'Действующий бизнес'}»
                    требуется взнос от {requiredContributionPercent}% ({formatRubles(minRequiredContribution)}).
                    Вам не хватает <strong>{formatRubles(minRequiredContribution - ownContribution)}</strong>.
                  </div>
                </div>
              )}

              {/* Запрашиваемая сумма кредита + авторасчет */}
              <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <Input
                      label="Запрашиваемая сумма кредита (₽)"
                      type="number"
                      step="50000"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      helperText="Рассчитывается как Стоимость − Собственный взнос"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Формула сходимости:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      {formatRubles(eqExpectedAmount)}
                    </span>
                  </div>
                </div>

                {/* Автопроверка формулы сходимости */}
                {eqIsMismatched && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>
                        Цифры не сходятся: стоимость {formatRubles(equipmentPrice)} − взнос{' '}
                        {formatRubles(ownContribution)} = {formatRubles(eqExpectedAmount)}, а запрошено{' '}
                        {formatRubles(amount)}.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAmount(eqExpectedAmount)}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shrink-0 transition-colors"
                    >
                      Скорректировать сумму
                    </button>
                  </div>
                )}
              </div>

              {/* Поставщик оборудования */}
              <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Поставщик оборудования уже выбран?
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="supplierStatus"
                      checked={supplierStatus === 'chosen'}
                      onChange={() => setSupplierStatus('chosen')}
                      className="text-alfa-500 focus:ring-alfa-500"
                    />
                      <span>Да, есть счёт / коммерческое предложение</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="supplierStatus"
                      checked={supplierStatus === 'searching'}
                      onChange={() => setSupplierStatus('searching')}
                      className="text-alfa-500 focus:ring-alfa-500"
                    />
                    <span>Пока выбираю (требуется помощь банка)</span>
                  </label>
                </div>

                {supplierStatus === 'chosen' ? (
                  <Input
                    label="ИНН или наименование поставщика"
                    value={equipmentSupplier}
                    onChange={(e) => setEquipmentSupplier(e.target.value)}
                    placeholder="Например: ООО «СтанкоПром» (ИНН 7701987654)"
                  />
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Аналитик банка предоставит перечень проверенных аккредитованных поставщиков оборудования в вашем регионе.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Для WC и START (Оборотные средства) */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Запрашиваемая сумма финансирования (₽)"
                    type="number"
                    step="50000"
                    min={currentProductConfig.minAmount}
                    max={currentProductConfig.maxAmount}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    helperText={`Лимит: ${formatRubles(currentProductConfig.minAmount)} – ${formatRubles(
                      currentProductConfig.maxAmount
                    )}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Сумма прописью
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 h-[42px] flex items-center">
                    {formatRubles(amount)}
                  </div>
                </div>
              </div>

              <div>
                <Input
                  label="Цель кредитования"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Опишите, на какие цели планируете направить средства"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(productCode === 'START'
                    ? [
                        'Закупка первой партии товара',
                        'Аренда и запуск торговой точки',
                        'Маркетинг и открытие бизнеса',
                        'Оборотные средства для старта',
                      ]
                    : [
                        'Пополнение оборотных средств',
                        'Закупка товаров для перепродажи',
                        'Закупка сырья и материалов',
                        'Закрытие кассового разрыва',
                      ]
                  ).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPurpose(chip)}
                      className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* СЦЕНАРИЙ 4: СРОК И ЧЕКБОКС «ПОМОГИТЕ ПОДОБРАТЬ»       */}
          {/* ---------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Срок кредитования
              </label>

              {/* Чекбокс «Помогите подобрать» */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-alfa-600 dark:text-alfa-400">
                <input
                  type="checkbox"
                  checked={helpWithTerm}
                  onChange={(e) => setHelpWithTerm(e.target.checked)}
                  className="rounded text-alfa-500 focus:ring-alfa-500"
                />
                <Sparkles className="w-3.5 h-3.5" />
                <span>Помогите подобрать комфортный срок</span>
              </label>
            </div>

            {helpWithTerm ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Срок кредита и оптимальный ежемесячный платёж будут рассчитаны кредитным аналитиком банка
                  (в диапазоне от {currentProductConfig.minTermMonths} до {currentProductConfig.maxTermMonths} мес.)
                  на основе анализа вашего денежного потока.
                </span>
              </div>
            ) : (
              <Select
                label="Желаемый срок кредита"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                options={[
                  { value: 6, label: '6 месяцев (полгода)' },
                  { value: 12, label: '12 месяцев (1 год)' },
                  { value: 18, label: '18 месяцев (1.5 года)' },
                  { value: 24, label: '24 месяца (2 года)' },
                  { value: 36, label: '36 месяцев (3 года)' },
                  { value: 48, label: '48 месяцев (4 года)' },
                ].filter(
                  (opt) =>
                    opt.value >= currentProductConfig.minTermMonths &&
                    opt.value <= currentProductConfig.maxTermMonths
                )}
              />
            )}
          </div>

          {/* ---------------------------------------------------- */}
          {/* СЦЕНАРИЙ 1: АДАПТАЦИЯ ШАГА 2 ПОД СТАДИЮ БИЗНЕСА      */}
          {/* ---------------------------------------------------- */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {businessType === 'operating' ? (
              /* ДЕЙСТВУЮЩИЙ БИЗНЕС: ВЫРУЧКА И РАСХОДЫ */
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Ежемесячные финансовые потоки действующего ИП
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Среднемесячная выручка (₽)"
                    type="number"
                    step="10000"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    helperText="Поступления по счетам и наличная выручка"
                  />
                  <Input
                    label="Среднемесячные расходы (₽)"
                    type="number"
                    step="10000"
                    value={expenses}
                    onChange={(e) => setExpenses(Number(e.target.value))}
                    helperText="Себестоимость, аренда, налоги, зарплаты"
                  />
                </div>

                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Расчетный чистый поток бизнеса:</span>
                  <span
                    className={`font-black text-sm ${
                      revenue - expenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}
                  >
                    {formatRubles(revenue - expenses)} / мес
                  </span>
                </div>
              </div>
            ) : (
              /* НОВЫЙ БИЗНЕС (PRELAUNCH): ВЫРУЧКА СКРЫТА, ИСТОЧНИКИ ПОКРЫТИЯ */
              <div className="space-y-4 p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/60">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Источники покрытия кредитных платежей (новый бизнес)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Для нового бизнеса среднемесячная выручка до запуска отсутствует. Оценка платежеспособности
                      проводится на основе ваших стабильных источников дохода, накоплений или залога.
                    </p>
                  </div>
                </div>

                {/* Мульти-выбор источников */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Из каких средств планируете платить до выхода на стабильную прибыль?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'salary', label: 'Работа по найму (зарплата)' },
                      { key: 'savings', label: 'Собственные сбережения / накопления' },
                      { key: 'rent_other', label: 'Аренда или другой действующий бизнес' },
                      { key: 'collateral', label: 'Залог недвижимости / поручительство' },
                      { key: 'future_revenue', label: 'Только будущая прибыль проекта' },
                    ].map((src) => (
                      <label
                        key={src.key}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          repaymentSources.includes(src.key)
                            ? 'border-purple-500 bg-white dark:bg-slate-900 ring-1 ring-purple-300 dark:ring-purple-800 text-slate-900 dark:text-white font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={repaymentSources.includes(src.key)}
                          onChange={() => toggleRepaymentSource(src.key)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>{src.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Уточняющие поля при выборе найма или аренды */}
                {(repaymentSources.includes('salary') || repaymentSources.includes('rent_other')) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/50 dark:border-purple-900/50">
                    <Input
                      label="Примерная сумма альтернативного дохода в месяц (₽)"
                      type="number"
                      step="10000"
                      value={alternateIncome}
                      onChange={(e) => setAlternateIncome(Number(e.target.value))}
                      helperText="Зарплата, дивиденды или арендные платежи"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Сохранится ли этот доход после запуска бизнеса?
                      </label>
                      <Select
                        value={incomeKept}
                        onChange={(e) => setIncomeKept(e.target.value as any)}
                        options={[
                          { value: 'yes', label: 'Да, доход в полной мере сохранится' },
                          { value: 'no', label: 'Нет, планирую уволиться/закрыть' },
                          { value: 'unsure', label: 'Пока не уверен / частично' },
                        ]}
                      />
                    </div>
                  </div>
                )}

                {/* Уточняющие поля при выборе накоплений */}
                {repaymentSources.includes('savings') && (
                  <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/50">
                    <Input
                      label="Сумма накоплений, выделенная на обслуживание кредита (₽)"
                      type="number"
                      step="20000"
                      value={savingsAmount}
                      onChange={(e) => setSavingsAmount(Number(e.target.value))}
                      helperText="Один и тот же резерв нельзя одновременно считать первоначальным взносом и деньгами на платежи"
                    />
                  </div>
                )}

                {/* Уточняющие поля при выборе залога */}
                {repaymentSources.includes('collateral') && (
                  <div className="space-y-3 pt-2 border-t border-purple-200/50 dark:border-purple-900/50 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Чей объект предоставляется в залог?
                        </label>
                        <Select
                          value={collateralType}
                          onChange={(e) => setCollateralType(e.target.value as any)}
                          options={[
                            { value: 'own', label: 'Собственность индивидуального предпринимателя' },
                            { value: 'third_party', label: 'Собственность родственника / партнера' },
                            { value: 'shared', label: 'Общая или долевая собственность' },
                          ]}
                        />
                      </div>
                      <Input
                        label="Адрес или кадастровый номер объекта"
                        value={collateralAddress}
                        onChange={(e) => setCollateralAddress(e.target.value)}
                        placeholder="г. Москва, ул. Ленина, д. 10 или 77:01:0001001:123"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={collateralClean}
                        onChange={(e) => setCollateralClean(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Объект свободен от текущих ипотек, арестов и других обременений</span>
                    </label>
                  </div>
                )}

                {/* Предупреждение если выбрана только будущая выручка */}
                {repaymentSources.length === 1 && repaymentSources.includes('future_revenue') && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Обратите внимание: финансирование стартапа исключительно под прогноз будущей прибыли
                      рассматривается кредитным аналитиком в индивидуальном порядке с повышенными требованиями к бизнес-плану.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Кнопки навигации */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setCurrentStep(1)}>
              Назад к выбору продукта
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(3)}
              disabled={eqIsMismatched}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Далее к документам
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* ШАГ 3: ДОКУМЕНТЫ, СОГЛАСИЯ И ОТПРАВКА ЗАЯВКИ          */}
      {/* ---------------------------------------------------- */}
      {currentStep === 3 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Шаг 3. Документы, юридические согласия и отправка в банк
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Прикрепите подтверждающие документы или воспользуйтесь опцией отложенной подачи
            </p>
          </div>

          {/* ---------------------------------------------------- */}
          {/* СЦЕНАРИЙ 4: ОПЦИЯ «ПРИЛОЖУ ПОЗЖЕ»                     */}
          {/* ---------------------------------------------------- */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Загрузка документов
              </span>

              {/* Чекбокс «Приложу позже» */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-alfa-600 dark:text-alfa-400">
                <input
                  type="checkbox"
                  checked={attachLater}
                  onChange={(e) => setAttachLater(e.target.checked)}
                  className="rounded text-alfa-500 focus:ring-alfa-500"
                />
                <FileText className="w-3.5 h-3.5" />
                <span>Приложу документы позже / по запросу аналитика</span>
              </label>
            </div>

            {attachLater ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  Вы можете зарегистрировать заявку прямо сейчас без загрузки выписок и договоров.
                  Система выполнит экспресс-проверку по государственным реестрам, а аналитик запросит
                  только необходимые документы в личном кабинете через сценарий <strong>need_info</strong>.
                </span>
              </div>
            ) : (
              <FileUpload
                onFileUploaded={handleFileUpload}
                existingDocuments={uploadedFiles.map((f, i) => ({
                  id: `temp-${i}`,
                  fileName: f.name,
                  fileSizeBytes: f.size,
                  fileType: 'bank_statement',
                  uploadedAt: new Date().toISOString(),
                  status: 'uploaded',
                }))}
              />
            )}
          </div>

          {/* Сводка заявки перед подтверждением */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
              Итоговая сводка параметров заявки
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Заёмщик:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {egripCompany?.fullName || `ИП (ИНН ${inn})`}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Кредитный продукт:</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ProductCodeBadge code={productCode} size="sm" />
                  {currentProductConfig.shortName}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Запрашиваемый кредит:</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatRubles(amount)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Срок кредита:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {helpWithTerm ? 'Подберёт банк (по заявке)' : `${termMonths} месяцев`}
                </span>
              </div>

              {productCode === 'EQ' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Стоимость оборудования:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatRubles(equipmentPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Собственный взнос:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRubles(ownContribution)} ({Math.round((ownContribution / (equipmentPrice || 1)) * 100)}%)
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Этап бизнеса:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {businessType === 'operating' ? 'Действующий бизнес' : 'Новый бизнес (Prelaunch)'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Документы:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {attachLater ? 'Отложенное предоставление' : `${uploadedFiles.length} файл(ов) загружено`}
                </span>
              </div>
            </div>
          </div>

          {/* Юридические согласия */}
          <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Юридические согласия
            </span>

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdnConsent}
                    onChange={(e) => setPdnConsent(e.target.checked)}
                    className="mt-0.5 rounded text-alfa-500 focus:ring-alfa-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Даю согласие на обработку персональных данных в соответствии с Федеральным законом № 152-ФЗ
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveConsentModal('pdn')}
                  className="text-alfa-600 dark:text-alfa-400 hover:underline shrink-0 font-medium"
                >
                  Ознакомиться
                </button>
              </div>

              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bkiConsent}
                    onChange={(e) => setBkiConsent(e.target.checked)}
                    className="mt-0.5 rounded text-alfa-500 focus:ring-alfa-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Даю согласие на запрос кредитного отчёта в бюро кредитных историй (БКИ) в соответствии с № 218-ФЗ
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveConsentModal('bki')}
                  className="text-alfa-600 dark:text-alfa-400 hover:underline shrink-0 font-medium"
                >
                  Ознакомиться
                </button>
              </div>

              {productCode === 'EQ' && businessType === 'prelaunch' && (
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leasingConsent}
                      onChange={(e) => setLeasingConsent(e.target.checked)}
                      className="mt-0.5 rounded text-alfa-500 focus:ring-alfa-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Согласен на передачу сведений лизинговому партнёру (ООО «Альфа-Лизинг») для подбора лизинговой программы
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveConsentModal('leasing')}
                    className="text-alfa-600 dark:text-alfa-400 hover:underline shrink-0 font-medium"
                  >
                    Ознакомиться
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки отправки */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setCurrentStep(2)}>
              Назад к параметрам
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial"
                isLoading={isLoading}
                onClick={() => handleSubmit(false)}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Сохранить черновик (T01)
              </Button>

              <Button
                variant="primary"
                className="flex-1 sm:flex-initial"
                isLoading={isLoading}
                disabled={!pdnConsent || !bkiConsent}
                onClick={() => handleSubmit(true)}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Отправить в банк (T03)
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Модальное окно просмотра юридических согласий */}
      {activeConsentModal && (
        <ConsentModal
          isOpen={true}
          onClose={() => setActiveConsentModal(null)}
          type={activeConsentModal}
          applicantName={egripCompany?.fullName || `ИП (ИНН ${inn})`}
          inn={inn}
          isAccepted={
            activeConsentModal === 'pdn'
              ? pdnConsent
              : activeConsentModal === 'bki'
              ? bkiConsent
              : leasingConsent
          }
          onAccept={() => {
            if (activeConsentModal === 'pdn') setPdnConsent(true);
            if (activeConsentModal === 'bki') setBkiConsent(true);
            if (activeConsentModal === 'leasing') setLeasingConsent(true);
          }}
        />
      )}
    </div>
  );
};
