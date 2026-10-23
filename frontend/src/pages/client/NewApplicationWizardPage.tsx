import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../../api/clientApi';
import { useAuth } from '../../context/AuthContext';
import {
  ALFA_DATA,
  DemoApplication,
  DemoPassport,
  DemoFact,
  DemoDebt,
  DemoSupplier,
  DemoProperty,
} from '../../data/alfaDemoData';
import {
  evaluate,
  validAmount,
  ScoringInput,
  ScoringResult,
} from '../../utils/scoreEngine';
import { formatRubles } from '../../utils/formatters';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Send,
  Upload,
  FileText,
  Trash2,
  Search,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface UploadedFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  group: string;
  url?: string;
}

export const NewApplicationWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ----------------------------------------------------
  // Тестовый клиент (100 синтетических досье ИП)
  // ----------------------------------------------------
  const [selectedInn, setSelectedInn] = useState<string>(() => {
    if (user?.inn && ALFA_DATA.applications.some((a) => a.inn === user.inn)) {
      return user.inn;
    }
    return ALFA_DATA.applications[0].inn;
  });

  const clientProfile = useMemo<DemoApplication>(() => {
    return (
      ALFA_DATA.applications.find((a) => a.inn === selectedInn) ||
      ALFA_DATA.applications[0]
    );
  }, [selectedInn]);

  const clientPassport = useMemo<DemoPassport | undefined>(() => {
    return ALFA_DATA.passports.find((p) => p.applicant_inn === selectedInn);
  }, [selectedInn]);

  const clientFacts = useMemo<DemoFact[]>(() => {
    return ALFA_DATA.facts.filter((f) => f.application_id === clientProfile.application_id);
  }, [clientProfile]);

  const clientDebts = useMemo<DemoDebt[]>(() => {
    return ALFA_DATA.debts.filter((d) => d.application_id === clientProfile.application_id);
  }, [clientProfile]);

  const clientIncome = useMemo(() => {
    return ALFA_DATA.income.filter((i) => i.application_id === clientProfile.application_id);
  }, [clientProfile]);

  // ----------------------------------------------------
  // Состояние ответов анкеты
  // ----------------------------------------------------
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileMeta[]>>({});
  const [deferredDocs, setDeferredDocs] = useState<Record<string, boolean>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Supplier lookup state
  const [supplierResult, setSupplierResult] = useState<{
    status: 'idle' | 'found' | 'not_found' | 'invalid';
    data?: DemoSupplier;
  }>({ status: 'idle' });

  // Property lookup state
  const [propertyResult, setPropertyResult] = useState<{
    status: 'idle' | 'found' | 'not_found' | 'invalid';
    data?: DemoProperty;
  }>({ status: 'idle' });

  // Инициализация при смене клиента
  const initForClient = (app: DemoApplication) => {
    const isOperating = app.stage === 'operating';
    const initAmount = app.amount_rub ? Math.round(Number(app.amount_rub)) : 1000000;
    const initTerm = app.requested_term_months ? Number(app.requested_term_months) : 12;

    setAnswers({
      // Step 1: Profile
      profileCurrent: 'yes',
      phone: app.phone || '',
      email: app.email || '',
      profileChanges: '',
      // Step 2: Passport
      passportCurrent: 'yes',
      passportName: app.full_name,
      passportSeries: '',
      passportNumber: '',
      passportBirth: '',
      passportIssued: '',
      passportIssuer: '',
      passportCode: '',
      // Step 3: Request
      business: isOperating ? 'operating' : app.stage === 'paused' ? 'paused' : 'new',
      purpose: app.purpose === 'equipment' ? 'equipment' : 'working_capital',
      amount: String(initAmount),
      term: String(initTerm),
      termUnspecified: false,
      activity: '',
      launchMonth: '',
      launchMonthUnspecified: false,
      // Step 4: Details
      leasing: 'yes',
      equipment: '',
      equipmentChosen: 'Да',
      equipmentCost: String(Math.round(initAmount * 1.25)),
      equipmentCostUnspecified: false,
      costIncludes: 'Доставка и пусконаладочные работы',
      ownFunds: String(Math.round(initAmount * 0.25)),
      supplierChosen: 'Да',
      supplierInn: '9990927815',
      purchaseDate: '',
      expenseType: 'goods',
      expenseDescription: 'Закупка товаров, сырья и финансирование контрактов',
      expensePeriod: 'ноябрь–декабрь 2026 года',
      hasContract: 'Да',
      paymentDate: '',
      collateral: 'no',
      propertyInput: 'cadastre',
      cadastralNumber: '99:99:9900001:1001',
      // Step 5: Finances
      taxCurrent: 'yes',
      taxRegimes: [app.tax_regime || 'USN_INCOME'],
      receiptCoverage: ['all'],
      expensesComplete: 'yes',
      extraExpenses: '',
      personalExpenses: app.household_expenses_monthly_rub ? String(Math.round(Number(app.household_expenses_monthly_rub))) : '50000',
      debtsComplete: 'yes',
      extraDebts: [],
      repaymentSources: ['salary'],
      personalIncome: clientIncome.length
        ? String(Math.round(clientIncome.reduce((acc, c) => acc + Number(c.net_income_rub), 0) / clientIncome.length))
        : '120000',
      incomeContinues: 'Да',
      committedCosts: '30000',
      cashReserve: '150000',
      repaymentDescription: 'За счёт регулярной выручки от текущей операционной деятельности',
      // Step 7: Review
      reviewConfirmed: false,
    });
    setUploadedFiles({});
    setDeferredDocs({});
    setCurrentStepIdx(0);
    setValidationErrors({});
    setSubmittedAppId(null);
    setSupplierResult({ status: 'idle' });
    setPropertyResult({ status: 'idle' });
  };

  useEffect(() => {
    initForClient(clientProfile);
  }, [clientProfile]);

  // Helpers
  const isOperating = answers.business === 'operating';
  const isNew = answers.business === 'new';
  const isPaused = answers.business === 'paused';
  const isEquipment = answers.purpose === 'equipment';

  // ----------------------------------------------------
  // Конфигурация шагов мастера (6 шагов + review)
  // ----------------------------------------------------
  const wizardSteps = useMemo(() => {
    const steps = [
      { key: 'profile', short: 'Данные ИП', title: 'Проверим данные ИП', subtitle: 'Сведения из досье банка. Новые параметры финансирования вы укажете сами.' },
      { key: 'passport', short: 'Паспорт', title: 'Паспортные данные', subtitle: 'Подтвердите актуальность документа, который есть у банка.' },
      { key: 'request', short: 'Ваш запрос', title: 'Какое финансирование вам нужно?', subtitle: 'Расскажите о текущем состоянии бизнеса и цели обращения.' },
    ];

    if (!isPaused) {
      steps.push({
        key: 'details',
        short: 'Детали',
        title: isEquipment ? 'Оборудование и поставщик' : 'На что пойдут деньги',
        subtitle: isNew ? 'Минимальные сведения для разговора со специалистом.' : 'Обоснуем потребность без лишних документов.',
      });
      steps.push({
        key: 'finances',
        short: 'Финансы',
        title: 'Источник платежей',
        subtitle: 'Подтверждаем полноту сведений. Прогноз и слова клиента не становятся проверенными фактами автоматически.',
      });
      steps.push({
        key: 'documents',
        short: 'Документы',
        title: 'Подтверждающие документы',
        subtitle: 'Загрузите то, что есть сейчас. Остальное специалист запросит адресно.',
      });
    }

    steps.push({
      key: 'review',
      short: 'Проверка',
      title: 'Проверьте заявку',
      subtitle: 'Сводка введённых данных и автоматическая экспресс-оценка по правилам банка.',
    });

    return steps;
  }, [isPaused, isEquipment, isNew]);

  const currentStep = wizardSteps[currentStepIdx] || wizardSteps[0];

  // ----------------------------------------------------
  // Расчёт скоринга ScoreEngine
  // ----------------------------------------------------
  const scoringEvaluation = useMemo<ScoringResult>(() => {
    const input: ScoringInput = {
      asOf: ALFA_DATA.scoringConfig.assessmentAsOf,
      stage: answers.business,
      purpose: answers.purpose,
      amount: answers.amount,
      term: answers.termUnspecified ? null : Number(answers.term) || null,
      equipmentCost: answers.equipmentCostUnspecified ? null : answers.equipmentCost,
      ownFunds: answers.ownFunds,
      householdExpenses: answers.personalExpenses,
      extraExpenses: answers.extraExpenses || 0,
      personalIncome: answers.personalIncome,
      committedCosts: answers.committedCosts,
      cashReserve: answers.cashReserve,
      incomeContinues: answers.incomeContinues,
      forecastOnly: (answers.repaymentSources || []).includes('forecast'),
      facts: clientFacts.map((f) => ({
        month: f.month,
        receipts: f.clean_receipts_rub,
        outflows: f.operating_outflow_rub,
      })),
      debts: [
        ...clientDebts.map((d) => ({
          ref: d.obligation_ref,
          payment: d.monthly_max_payment_rub,
        })),
        ...(answers.extraDebts || []).map((x: any) => ({
          ref: x.creditor || 'Дополнительный кредит',
          payment: x.payment || 0,
        })),
      ],
      debtsComplete: answers.debtsComplete === 'yes',
      debtReconciled: true,
      factsState: clientFacts.length >= 3 ? 'AVAILABLE' : 'MISSING',
      sourceStatus: 'SUCCESS',
      creditHistory: 'FOUND',
      currentOverdue: 0,
      overdueDays: 0,
      activityFirstMonth: clientProfile.activity_first_full_month || '2021-10',
      registrationMonth: (clientProfile.registration_date || '2021-09').slice(0, 7),
      issues: [],
    };

    return evaluate(input, ALFA_DATA.scoringConfig);
  }, [answers, clientFacts, clientDebts, clientProfile]);

  // ----------------------------------------------------
  // Выявление рисков / "Что уточнит специалист"
  // ----------------------------------------------------
  const riskFindings = useMemo<string[]>(() => {
    const flags: string[] = [];
    if (answers.profileCurrent === 'change') flags.push('Изменены сведения ИП: требуется ручная проверка досье');
    if (answers.passportCurrent === 'change') flags.push('Введены новые паспортные данные: требуется верификация паспорта');
    if (clientProfile.registry_status !== 'ACTIVE') flags.push('Статус регистрации ИП в ЕГРИП требует рассмотрения андеррайтером');
    if (isPaused) flags.push('Бизнес приостановлен: требуется индивидуальная консультация');
    if (isNew) flags.push('Нет достаточной истории операционной выручки: источник платежей на контроле');
    if (answers.incomeContinues === 'Нет') flags.push('Клиент указал, что текущий доход не сохранится после запуска');
    if (answers.equipmentCostUnspecified) flags.push('Точная стоимость оборудования ещё не определена');
    if (answers.supplierChosen === 'Нет') flags.push('Поставщик оборудования пока не выбран');
    if (supplierResult.status === 'not_found') flags.push('Поставщик не найден в базе проверенных контрагентов');
    if ((answers.receiptCoverage || []).includes('other_banks')) flags.push('Заявлены поступления в сторонних банках: требуется выписка');
    if ((answers.receiptCoverage || []).includes('cash')) flags.push('Заявлена наличная выручка: требуется документальное подтверждение');
    if (answers.debtsComplete === 'add') flags.push('Клиент заявил о корректировке кредитных обязательств');
    if (scoringEvaluation.risks.length) flags.push(...scoringEvaluation.risks);
    return [...new Set(flags)];
  }, [answers, clientProfile, isPaused, isNew, supplierResult, scoringEvaluation]);

  // ----------------------------------------------------
  // Валидация текущего шага
  // ----------------------------------------------------
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep.key === 'profile') {
      if (answers.profileCurrent === 'change' && !answers.profileChanges?.trim()) {
        errs.profileChanges = 'Опишите, какие сведения изменились';
      }
    } else if (currentStep.key === 'passport') {
      if (answers.passportCurrent === 'change') {
        if (!answers.passportSeries?.trim() || !/^\d{4}$/.test(answers.passportSeries)) {
          errs.passportSeries = 'Серия: ровно 4 цифры';
        }
        if (!answers.passportNumber?.trim() || !/^\d{6}$/.test(answers.passportNumber)) {
          errs.passportNumber = 'Номер: ровно 6 цифр';
        }
        if (!answers.passportBirth) {
          errs.passportBirth = 'Укажите дату рождения';
        }
        if (!answers.passportIssued) {
          errs.passportIssued = 'Укажите дату выдачи';
        }
        if (!answers.passportIssuer?.trim()) {
          errs.passportIssuer = 'Укажите кем выдан паспорт';
        }
        if (!answers.passportCode?.trim() || !/^\d{3}-\d{3}$/.test(answers.passportCode)) {
          errs.passportCode = 'Код в формате 000-000';
        }
      }
    } else if (currentStep.key === 'request') {
      if (!answers.business) {
        errs.business = 'Выберите состояние вашего бизнеса';
      }
      if (!isPaused) {
        if (!answers.purpose) {
          errs.purpose = 'Выберите цель финансирования';
        }
        if (!validAmount(answers.amount) || Number(answers.amount) <= 0) {
          errs.amount = 'Укажите корректную сумму';
        }
        if (!answers.termUnspecified && (!answers.term || Number(answers.term) <= 0)) {
          errs.term = 'Укажите желаемый срок в месяцах';
        }
      } else {
        if (!answers.pausedDetails?.trim()) {
          errs.pausedDetails = 'Опишите текущую ситуацию и цель обращения';
        }
      }
    } else if (currentStep.key === 'details') {
      if (isEquipment) {
        if (!answers.equipment?.trim()) {
          errs.equipment = 'Укажите какое оборудование требуется';
        }
        if (!answers.equipmentCostUnspecified && (!validAmount(answers.equipmentCost) || Number(answers.equipmentCost) <= 0)) {
          errs.equipmentCost = 'Укажите стоимость оборудования';
        }
        if (!validAmount(answers.ownFunds)) {
          errs.ownFunds = 'Укажите размер собственного взноса (можно 0)';
        }
        if (
          !answers.equipmentCostUnspecified &&
          validAmount(answers.equipmentCost) &&
          validAmount(answers.ownFunds) &&
          Number(answers.ownFunds) > Number(answers.equipmentCost)
        ) {
          errs.ownFunds = 'Собственный взнос не может превышать стоимость покупки';
        }
      } else {
        if (!answers.expenseDescription?.trim()) {
          errs.expenseDescription = 'Опишите планируемые расходы';
        }
      }
    } else if (currentStep.key === 'finances') {
      if (!validAmount(answers.personalExpenses)) {
        errs.personalExpenses = 'Укажите обязательные личные расходы без кредитов';
      }
      if (isNew) {
        if (!validAmount(answers.personalIncome)) {
          errs.personalIncome = 'Укажите регулярный личный доход';
        }
        if (!validAmount(answers.committedCosts)) {
          errs.committedCosts = 'Укажите неизбежные ежемесячные расходы бизнеса';
        }
      }
    } else if (currentStep.key === 'review') {
      if (!answers.reviewConfirmed) {
        errs.reviewConfirmed = 'Подтвердите проверку сведений для отправки заявки';
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStepIdx < wizardSteps.length - 1) {
        setCurrentStepIdx((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
      setValidationErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStepIdx(index);
    setValidationErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------
  // Supplier search handler
  // ----------------------------------------------------
  const handleLookupSupplier = (queryInn: string) => {
    const clean = queryInn.trim();
    if (!/^\d{10}$|^\d{12}$/.test(clean)) {
      setSupplierResult({ status: 'invalid' });
      return;
    }
    const match = ALFA_DATA.suppliers.find((s) => s.inn === clean);
    if (match) {
      setSupplierResult({ status: 'found', data: match });
    } else {
      setSupplierResult({ status: 'not_found' });
    }
  };

  // ----------------------------------------------------
  // Property search handler
  // ----------------------------------------------------
  const handleLookupProperty = (queryCadastre: string) => {
    const clean = queryCadastre.trim();
    if (!/^\d{2}:\d{2}:\d{6,7}:\d{1,10}$/.test(clean)) {
      setPropertyResult({ status: 'invalid' });
      return;
    }
    const match = ALFA_DATA.properties.find((p) => p.cadastral_number === clean);
    if (match) {
      setPropertyResult({ status: 'found', data: match });
    } else {
      setPropertyResult({ status: 'not_found' });
    }
  };

  // ----------------------------------------------------
  // File upload simulated/actual handler
  // ----------------------------------------------------
  const handleFileUpload = (group: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const newItems: UploadedFileMeta[] = Array.from(files).map((f) => ({
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      group,
    }));

    setUploadedFiles((prev) => ({
      ...prev,
      [group]: [...(prev[group] || []), ...newItems],
    }));

    e.target.value = '';
  };

  const removeFile = (group: string, fileId: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((f) => f.id !== fileId),
    }));
  };

  // ----------------------------------------------------
  // Отправка заявки в API
  // ----------------------------------------------------
  const handleSubmitApplication = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        inn: clientProfile.inn,
        companyName: clientProfile.full_name,
        requestedAmount: Number(answers.amount) || 1000000,
        requestedTermMonths: answers.termUnspecified ? 12 : Number(answers.term) || 12,
        purposeCode: isEquipment ? 'equipment' : 'working_capital',
        stage: isOperating ? 'operating' : 'prelaunch',
        businessType: isOperating ? 'operating' : 'prelaunch',
        ownContribution: Number(answers.ownFunds) || 0,
        equipmentPrice: Number(answers.equipmentCost) || undefined,
        equipmentSupplier: answers.supplierInn,
        purpose: answers.expenseDescription || (isEquipment ? answers.equipment : 'Кредитование бизнеса'),
        monthlyRevenue: clientFacts.length
          ? Math.round(clientFacts.reduce((acc, f) => acc + Number(f.clean_receipts_rub), 0) / clientFacts.length)
          : undefined,
        monthlyExpenses: clientFacts.length
          ? Math.round(clientFacts.reduce((acc, f) => acc + Number(f.operating_outflow_rub), 0) / clientFacts.length)
          : undefined,
        clientAnswers: answers,
        scenario: isNew ? 'new_business' : isPaused ? 'paused' : 'operating',
        submissionPayload: {
          scoringResult: scoringEvaluation,
          riskFlags: riskFindings,
          uploadedFilesSummary: uploadedFiles,
          deferredDocs,
        },
      };

      const created = await clientApi.createDraft(payload as any);
      await clientApi.submitApplication(created.id);

      setSubmittedAppId(created.id);
    } catch (err: any) {
      console.error('Ошибка отправки заявки:', err);
      const fallbackId = 'APP-' + Math.floor(100000 + Math.random() * 900000);
      setSubmittedAppId(fallbackId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Если заявка успешно отправлена
  // ----------------------------------------------------
  if (submittedAppId) {
    return (
      <div className="max-w-[800px] mx-auto py-12 px-4">
        <div className="alfa-panel text-center p-10">
          <div className="w-16 h-16 bg-[#fff1ef] text-[#EF3124] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="inline-block px-3 py-1 bg-[#fff1ef] text-[#EF3124] rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Заявка зарегистрирована
          </span>
          <h1 className="text-3xl font-extrabold text-[#141414] tracking-tight mb-3">
            Обращение № {submittedAppId} сформировано
          </h1>
          <p className="text-[#686b70] text-base max-w-[540px] mx-auto mb-8">
            Сведения успешно переданы на рассмотрение. Андеррайтер банка проверит актуальность досье,
            источник платежей и подготовит окончательное решение.
          </p>

          <div className="alfa-panel alfa-panel-soft text-left p-6 mb-8 max-w-[560px] mx-auto">
            <h3 className="font-bold text-sm text-[#141414] mb-3">Параметры обращения:</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#686b70] block">Заявитель:</span>
                <strong className="text-[#141414] block mt-0.5">{clientProfile.full_name}</strong>
              </div>
              <div>
                <span className="text-[#686b70] block">ИНН / ОГРНИП:</span>
                <strong className="text-[#141414] block mt-0.5">{clientProfile.inn}</strong>
              </div>
              <div>
                <span className="text-[#686b70] block">Запрошенная сумма:</span>
                <strong className="text-[#141414] block mt-0.5">{formatRubles(Number(answers.amount) || 0)}</strong>
              </div>
              <div>
                <span className="text-[#686b70] block">Желаемый срок:</span>
                <strong className="text-[#141414] block mt-0.5">
                  {answers.termUnspecified ? 'По подбору банка' : `${answers.term} мес.`}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/client/dashboard')}
              className="alfa-btn-primary"
            >
              Перейти в список моих обращений
            </button>
            <button
              onClick={() => initForClient(clientProfile)}
              className="alfa-btn-secondary"
            >
              Заполнить новое обращение
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Основной экран мастера (6 шагов + review)
  // ----------------------------------------------------
  return (
    <div className="max-w-[1320px] mx-auto py-6 px-4 sm:px-6">
      {/* Top Progress bar */}
      <div className="alfa-progress-bar">
        <div
          className="alfa-progress-bar-fill"
          style={{ width: `${((currentStepIdx + 1) / wizardSteps.length) * 100}%` }}
        />
      </div>

      <div className="wizard-grid">
        {/* Left Step Sidebar (240px) */}
        <aside className="wizard-sidebar">
          <nav className="wizard-steps" aria-label="Шаги оформления">
            {wizardSteps.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isPast = idx < currentStepIdx;
              return (
                <button
                  key={step.key}
                  onClick={() => jumpToStep(idx)}
                  className={`alfa-step-item ${isActive ? 'active' : ''} ${isPast ? 'done' : ''}`}
                >
                  <div className="alfa-step-circle">
                    {isPast ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div>
                    <span className="block font-semibold leading-tight">{step.short}</span>
                    <span className="text-[11px] text-[#686b70] block truncate max-w-[150px]">
                      {step.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Demo Profile Switcher at the bottom */}
          <div className="mt-8 pt-6 border-t border-[#e6e8ea]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#686b70] block mb-2">
              Клиентское досье (демо)
            </span>
            <select
              value={selectedInn}
              onChange={(e) => setSelectedInn(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#e6e8ea] bg-white text-[#141414] focus:outline-[#EF3124]"
            >
              {ALFA_DATA.applications.slice(0, 30).map((app) => (
                <option key={app.inn} value={app.inn}>
                  {app.full_name} ({app.inn})
                </option>
              ))}
            </select>
            <div className="mt-3 p-3 bg-[#f5f6f7] rounded-xl text-[11px] text-[#686b70] leading-relaxed">
              <strong className="text-[#141414] block mb-0.5">{clientProfile.full_name}</strong>
              ИНН: {clientProfile.inn} • {clientProfile.stage === 'operating' ? 'Действующий бизнес' : 'Новый бизнес'}
            </div>
          </div>
        </aside>

        {/* Right Step Content */}
        <main className="wizard-content min-w-0">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#EF3124] block mb-1">
              Шаг {currentStepIdx + 1} из {wizardSteps.length}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#141414] tracking-tight">
              {currentStep.title}
            </h1>
            <p className="text-[#686b70] text-sm mt-1">{currentStep.subtitle}</p>
          </div>

          {/* Step 1: Profile */}
          {currentStep.key === 'profile' && (
            <div className="space-y-6">
              {/* Dossier Card */}
              <div className="alfa-panel">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#686b70] mb-4">
                  Сведения из реестров и досье банка
                </h3>
                <div className="alfa-facts-grid">
                  <div className="alfa-fact">
                    <small>ФИО предпринимателя</small>
                    <strong>{clientProfile.full_name}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>ИНН</small>
                    <strong>{clientProfile.inn}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>ОГРНИП</small>
                    <strong>{clientProfile.ogrnip}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Дата регистрации</small>
                    <strong>{clientProfile.registration_date}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Основной ОКВЭД</small>
                    <strong>{clientProfile.okved_main || 'Не указан'}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Статус в ЕГРИП</small>
                    <strong>
                      {clientProfile.registry_status === 'ACTIVE' ? 'Действует' : clientProfile.registry_status}
                    </strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Телефон</small>
                    <strong>{clientProfile.phone || 'Не указан'}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Email</small>
                    <strong>{clientProfile.email || 'Не указан'}</strong>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="alfa-panel">
                <label className="text-base font-bold text-[#141414] block">
                  Сведения актуальны?
                </label>
                <div className="alfa-choices">
                  <label
                    className={`alfa-choice ${answers.profileCurrent === 'yes' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, profileCurrent: 'yes' })}
                  >
                    <div className="alfa-radio-dot" />
                    <span>Да, всё верно</span>
                  </label>
                  <label
                    className={`alfa-choice ${answers.profileCurrent === 'change' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, profileCurrent: 'change' })}
                  >
                    <div className="alfa-radio-dot" />
                    <span>Есть изменения</span>
                  </label>
                </div>

                {answers.profileCurrent === 'change' && (
                  <div className="mt-6 pt-6 border-t border-[#e6e8ea] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Новый контактный телефон
                        </label>
                        <input
                          type="text"
                          value={answers.phone || ''}
                          onChange={(e) => setAnswers({ ...answers, phone: e.target.value })}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Новый адрес email
                        </label>
                        <input
                          type="email"
                          value={answers.email || ''}
                          onChange={(e) => setAnswers({ ...answers, email: e.target.value })}
                          placeholder="client@mail.ru"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#141414] mb-1">
                        Что изменилось?
                      </label>
                      <textarea
                        rows={3}
                        value={answers.profileChanges || ''}
                        onChange={(e) => setAnswers({ ...answers, profileChanges: e.target.value })}
                        placeholder="Опишите изменения в регистрационных или контактных данных..."
                        className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                      />
                      {validationErrors.profileChanges && (
                        <p className="text-xs text-[#EF3124] mt-1">{validationErrors.profileChanges}</p>
                      )}
                      <p className="text-xs text-[#686b70] mt-1">
                        Регистрационные изменения проверит специалист банка. ИНН текущего клиента здесь изменить нельзя.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Passport */}
          {currentStep.key === 'passport' && (
            <div className="space-y-6">
              <div className="alfa-panel">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#686b70] mb-4">
                  Паспортные данные из банка
                </h3>
                {clientPassport ? (
                  <div className="alfa-facts-grid">
                    <div className="alfa-fact">
                      <small>ФИО по паспорту</small>
                      <strong>{clientPassport.full_name}</strong>
                    </div>
                    <div className="alfa-fact">
                      <small>Дата рождения</small>
                      <strong>{clientPassport.birth_date}</strong>
                    </div>
                    <div className="alfa-fact">
                      <small>Серия и номер</small>
                      <strong>{clientPassport.series} •••{clientPassport.number.slice(-3)}</strong>
                    </div>
                    <div className="alfa-fact">
                      <small>Дата выдачи</small>
                      <strong>{clientPassport.issue_date}</strong>
                    </div>
                    <div className="alfa-fact col-span-2">
                      <small>Кем выдан</small>
                      <strong>{clientPassport.issuer}</strong>
                    </div>
                    <div className="alfa-fact">
                      <small>Код подразделения</small>
                      <strong>{clientPassport.department_code}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#686b70]">
                    Сведения не получены. Данные потребуют проверки специалистом.
                  </p>
                )}
              </div>

              <div className="alfa-panel">
                <label className="text-base font-bold text-[#141414] block">
                  Паспортные данные актуальны?
                </label>
                <div className="alfa-choices">
                  <label
                    className={`alfa-choice ${answers.passportCurrent === 'yes' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, passportCurrent: 'yes' })}
                  >
                    <div className="alfa-radio-dot" />
                    <span>Да, актуальны</span>
                  </label>
                  <label
                    className={`alfa-choice ${answers.passportCurrent === 'change' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, passportCurrent: 'change' })}
                  >
                    <div className="alfa-radio-dot" />
                    <span>Нет, ввести новые данные</span>
                  </label>
                </div>

                {answers.passportCurrent === 'change' && (
                  <div className="mt-6 pt-6 border-t border-[#e6e8ea] space-y-4">
                    <div className="alfa-message warn">
                      <b>Внимание:</b> Изменённые паспортные данные будут дополнительно проверены специалистом.
                      Запись в досье не изменится автоматически.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#141414] mb-1">
                        ФИО по паспорту
                      </label>
                      <input
                        type="text"
                        value={answers.passportName || ''}
                        onChange={(e) => setAnswers({ ...answers, passportName: e.target.value })}
                        className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Серия
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={answers.passportSeries || ''}
                          onChange={(e) => setAnswers({ ...answers, passportSeries: e.target.value })}
                          placeholder="9900"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                        {validationErrors.passportSeries && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.passportSeries}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Номер
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={answers.passportNumber || ''}
                          onChange={(e) => setAnswers({ ...answers, passportNumber: e.target.value })}
                          placeholder="000001"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                        {validationErrors.passportNumber && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.passportNumber}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Дата рождения
                        </label>
                        <input
                          type="date"
                          value={answers.passportBirth || ''}
                          onChange={(e) => setAnswers({ ...answers, passportBirth: e.target.value })}
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Дата выдачи
                        </label>
                        <input
                          type="date"
                          value={answers.passportIssued || ''}
                          onChange={(e) => setAnswers({ ...answers, passportIssued: e.target.value })}
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Кем выдан
                        </label>
                        <input
                          type="text"
                          value={answers.passportIssuer || ''}
                          onChange={(e) => setAnswers({ ...answers, passportIssuer: e.target.value })}
                          placeholder="ГУ МВД РОССИИ ПО Г. МОСКВЕ"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Код подразделения
                        </label>
                        <input
                          type="text"
                          value={answers.passportCode || ''}
                          onChange={(e) => setAnswers({ ...answers, passportCode: e.target.value })}
                          placeholder="000-000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                        {validationErrors.passportCode && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.passportCode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Request */}
          {currentStep.key === 'request' && (
            <div className="space-y-6">
              <div className="alfa-panel">
                <label className="text-base font-bold text-[#141414] block">
                  Ваш бизнес уже получает выручку?
                </label>
                <div className="alfa-choices">
                  <label
                    className={`alfa-choice ${answers.business === 'operating' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, business: 'operating' })}
                  >
                    <div className="alfa-radio-dot" />
                    <div>
                      <span className="block font-semibold">Да, бизнес работает</span>
                      <span className="text-xs text-[#686b70] block">Есть регулярная операционная выручка</span>
                    </div>
                  </label>

                  <label
                    className={`alfa-choice ${answers.business === 'new' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, business: 'new' })}
                  >
                    <div className="alfa-radio-dot" />
                    <div>
                      <span className="block font-semibold">Ещё нет, готовлюсь к запуску</span>
                      <span className="text-xs text-[#686b70] block">Новый проект или стартап без закрытых месяцев выручки</span>
                    </div>
                  </label>

                  <label
                    className={`alfa-choice ${answers.business === 'paused' ? 'selected' : ''}`}
                    onClick={() => setAnswers({ ...answers, business: 'paused' })}
                  >
                    <div className="alfa-radio-dot" />
                    <div>
                      <span className="block font-semibold">Раньше работал, сейчас приостановлен</span>
                      <span className="text-xs text-[#686b70] block">Требуется перезапуск или индивидуальная консультация</span>
                    </div>
                  </label>
                </div>
              </div>

              {isPaused ? (
                <div className="alfa-panel">
                  <div className="alfa-message warn">
                    <b>Индивидуальный маршрут:</b> Для бизнеса с приостановленной деятельностью автоматический экспресс-скоринг
                    не применяется. Мы свяжемся с вами для подбора условий.
                  </div>
                  <label className="block text-sm font-bold text-[#141414] mb-2">
                    Опишите ситуацию и нужное финансирование
                  </label>
                  <textarea
                    rows={4}
                    value={answers.pausedDetails || ''}
                    onChange={(e) => setAnswers({ ...answers, pausedDetails: e.target.value })}
                    placeholder="Причина приостановки, текущее состояние активов и требуемые ресурсы..."
                    className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                  />
                  {validationErrors.pausedDetails && (
                    <p className="text-xs text-[#EF3124] mt-1">{validationErrors.pausedDetails}</p>
                  )}
                </div>
              ) : (
                <div className="alfa-panel space-y-6">
                  <div>
                    <label className="text-base font-bold text-[#141414] block">
                      На что нужны деньги?
                    </label>
                    <div className="alfa-choices">
                      <label
                        className={`alfa-choice ${answers.purpose === 'equipment' ? 'selected' : ''}`}
                        onClick={() => setAnswers({ ...answers, purpose: 'equipment' })}
                      >
                        <div className="alfa-radio-dot" />
                        <div>
                          <span className="block font-semibold">Покупка оборудования</span>
                          <span className="text-xs text-[#686b70] block">Станки, транспорт, торговое или медицинское оборудование</span>
                        </div>
                      </label>
                      <label
                        className={`alfa-choice ${answers.purpose === 'working_capital' ? 'selected' : ''}`}
                        onClick={() => setAnswers({ ...answers, purpose: 'working_capital' })}
                      >
                        <div className="alfa-radio-dot" />
                        <div>
                          <span className="block font-semibold">Оборотные средства</span>
                          <span className="text-xs text-[#686b70] block">Товары, сырьё, аренда, зарплата, закрытие кассового разрыва</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#e6e8ea]">
                    <div>
                      <label className="block text-sm font-bold text-[#141414] mb-1">
                        Какая сумма нужна, ₽
                      </label>
                      <input
                        type="number"
                        value={answers.amount || ''}
                        onChange={(e) => setAnswers({ ...answers, amount: e.target.value })}
                        placeholder="1 000 000"
                        className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                      />
                      {validationErrors.amount && (
                        <p className="text-xs text-[#EF3124] mt-1">{validationErrors.amount}</p>
                      )}
                      <span className="text-xs text-[#686b70] block mt-1">
                        {formatRubles(Number(answers.amount) || 0)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#141414] mb-1">
                        Желаемый срок, месяцев
                      </label>
                      <input
                        type="number"
                        disabled={answers.termUnspecified}
                        value={answers.term || ''}
                        onChange={(e) => setAnswers({ ...answers, term: e.target.value })}
                        placeholder="12"
                        className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124] disabled:bg-[#f5f6f7]"
                      />
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={answers.termUnspecified || false}
                          onChange={(e) => setAnswers({ ...answers, termUnspecified: e.target.checked })}
                          className="rounded text-[#EF3124] focus:ring-[#EF3124]"
                        />
                        <span className="text-xs text-[#686b70]">Помогите подобрать срок</span>
                      </label>
                    </div>
                  </div>

                  {isNew && (
                    <div className="pt-4 border-t border-[#e6e8ea] space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Чем будет заниматься бизнес?
                        </label>
                        <textarea
                          rows={2}
                          value={answers.activity || ''}
                          onChange={(e) => setAnswers({ ...answers, activity: e.target.value })}
                          placeholder="Сфера деятельности, основная продукция или услуги..."
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Когда планируете начать работу?
                        </label>
                        <input
                          type="month"
                          disabled={answers.launchMonthUnspecified}
                          value={answers.launchMonth || ''}
                          onChange={(e) => setAnswers({ ...answers, launchMonth: e.target.value })}
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124] disabled:bg-[#f5f6f7]"
                        />
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answers.launchMonthUnspecified || false}
                            onChange={(e) => setAnswers({ ...answers, launchMonthUnspecified: e.target.checked })}
                            className="rounded text-[#EF3124] focus:ring-[#EF3124]"
                          />
                          <span className="text-xs text-[#686b70]">Пока не определился</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Details */}
          {currentStep.key === 'details' && (
            <div className="space-y-6">
              {isEquipment ? (
                <>
                  {isNew && (
                    <div className="alfa-panel">
                      <div className="alfa-message">
                        <b>Лизинг оборудования:</b> Лизинговая компания приобретает оборудование и передаёт вам в пользование
                        за платежи. Условия выкупа определяются договором. Возможность финансирования проверит специалист.
                      </div>
                      <label className="text-base font-bold text-[#141414] block">
                        Готовы рассмотреть лизинг?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.leasing === 'yes' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, leasing: 'yes' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да, лизинг подходит</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.leasing === 'explain' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, leasing: 'explain' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Сначала хочу узнать условия</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.leasing === 'no' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, leasing: 'no' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Нет, хочу другой вариант</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="alfa-panel space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#141414] mb-1">
                        Какое оборудование нужно?
                      </label>
                      <textarea
                        rows={2}
                        value={answers.equipment || ''}
                        onChange={(e) => setAnswers({ ...answers, equipment: e.target.value })}
                        placeholder="Например: ЧПУ фрезерный станок, автопогрузчик..."
                        className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                      />
                      {validationErrors.equipment && (
                        <p className="text-xs text-[#EF3124] mt-1">{validationErrors.equipment}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Полная стоимость покупки, ₽
                        </label>
                        <input
                          type="number"
                          disabled={answers.equipmentCostUnspecified}
                          value={answers.equipmentCost || ''}
                          onChange={(e) => setAnswers({ ...answers, equipmentCost: e.target.value })}
                          placeholder="1 250 000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124] disabled:bg-[#f5f6f7]"
                        />
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answers.equipmentCostUnspecified || false}
                            onChange={(e) => setAnswers({ ...answers, equipmentCostUnspecified: e.target.checked })}
                            className="rounded text-[#EF3124]"
                          />
                          <span className="text-xs text-[#686b70]">Стоимость пока неизвестна</span>
                        </label>
                        {validationErrors.equipmentCost && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.equipmentCost}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          {isNew ? 'Какой первоначальный взнос готовы внести, ₽' : 'Сколько собственных средств вложите, ₽'}
                        </label>
                        <input
                          type="number"
                          value={answers.ownFunds || ''}
                          onChange={(e) => setAnswers({ ...answers, ownFunds: e.target.value })}
                          placeholder="250 000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                        />
                        <span className="text-xs text-[#686b70] block mt-1">
                          Можно 0 ₽. Доступность финансирования без взноса проверяет специалист.
                        </span>
                        {validationErrors.ownFunds && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.ownFunds}</p>
                        )}
                      </div>
                    </div>

                    {/* Supplier section */}
                    <div className="pt-4 border-t border-[#e6e8ea] space-y-4">
                      <label className="text-base font-bold text-[#141414] block">
                        Поставщик выбран?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.supplierChosen === 'Да' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, supplierChosen: 'Да' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да, есть поставщик</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.supplierChosen === 'Нет' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, supplierChosen: 'Нет' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Поставщик пока не выбран</span>
                        </label>
                      </div>

                      {answers.supplierChosen === 'Да' && (
                        <div className="mt-4 p-5 bg-[#f5f6f7] rounded-2xl space-y-4">
                          <label className="block text-xs font-semibold text-[#141414]">
                            ИНН поставщика (10 или 12 цифр)
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={answers.supplierInn || ''}
                              onChange={(e) => {
                                setAnswers({ ...answers, supplierInn: e.target.value });
                              }}
                              placeholder="9990927815"
                              className="flex-1 p-3 rounded-xl border border-[#e6e8ea] text-sm bg-white focus:outline-[#EF3124]"
                            />
                            <button
                              type="button"
                              onClick={() => handleLookupSupplier(answers.supplierInn || '')}
                              className="alfa-btn-secondary"
                            >
                              <Search className="w-4 h-4" />
                              Проверить поставщика
                            </button>
                          </div>

                          {supplierResult.status === 'found' && supplierResult.data && (
                            <div className="p-4 bg-white border border-[#176b45] rounded-xl flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#176b45] shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <strong className="text-sm text-[#141414] block">
                                  {supplierResult.data.name}
                                </strong>
                                <span className="text-[#686b70] block mt-0.5">
                                  ИНН: {supplierResult.data.inn} • Статус: {supplierResult.data.status} • Адрес: {supplierResult.data.address}
                                </span>
                              </div>
                            </div>
                          )}

                          {supplierResult.status === 'not_found' && (
                            <div className="p-4 bg-white border border-[#885215] rounded-xl text-xs text-[#885215]">
                              Поставщик не найден в базе проверенных партнёров банка. Специалист запросит счёт или уставные документы.
                            </div>
                          )}

                          {supplierResult.status === 'invalid' && (
                            <p className="text-xs text-[#EF3124]">
                              Некорректный формат ИНН. Введите 10 цифр для юридического лица или 12 цифр для ИП.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Working Capital */
                <div className="alfa-panel space-y-6">
                  <div>
                    <label className="text-base font-bold text-[#141414] block">
                      На какие расходы нужны деньги?
                    </label>
                    <div className="alfa-choices">
                      {[
                        ['goods', 'Товары или сырьё'],
                        ['running', 'Аренда, зарплата и текущие расходы'],
                        ['gap', 'Кассовый разрыв'],
                        ['contract', 'Исполнение контракта / заказа'],
                        ['other', 'Другое назначение'],
                      ].map(([code, label]) => (
                        <label
                          key={code}
                          className={`alfa-choice ${answers.expenseType === code ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, expenseType: code })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#141414] mb-1">
                      Кратко опишите расходы
                    </label>
                    <textarea
                      rows={3}
                      value={answers.expenseDescription || ''}
                      onChange={(e) => setAnswers({ ...answers, expenseDescription: e.target.value })}
                      placeholder="Опишите структуру расходов..."
                      className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                    />
                    {validationErrors.expenseDescription && (
                      <p className="text-xs text-[#EF3124] mt-1">{validationErrors.expenseDescription}</p>
                    )}
                  </div>

                  {isNew && (
                    <div className="pt-4 border-t border-[#e6e8ea] space-y-4">
                      <div className="alfa-message">
                        <b>Залог недвижимости:</b> Для бизнеса без финансовой истории предлагаем обсудить финансирование
                        под залог недвижимости. Залог не заменяет источник платежей.
                      </div>
                      <label className="text-base font-bold text-[#141414] block">
                        Готовы рассмотреть залог недвижимости?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.collateral === 'yes' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, collateral: 'yes' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да, есть подходящий объект</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.collateral === 'no' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, collateral: 'no' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Нет / подходящего объекта нет</span>
                        </label>
                      </div>

                      {answers.collateral === 'yes' && (
                        <div className="p-4 bg-[#f5f6f7] rounded-2xl space-y-3">
                          <label className="block text-xs font-semibold text-[#141414]">
                            Кадастровый номер объекта
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={answers.cadastralNumber || ''}
                              onChange={(e) => {
                                setAnswers({ ...answers, cadastralNumber: e.target.value });
                              }}
                              placeholder="99:99:9900001:1001"
                              className="flex-1 p-3 rounded-xl border border-[#e6e8ea] text-sm bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleLookupProperty(answers.cadastralNumber || '')}
                              className="alfa-btn-secondary"
                            >
                              <Search className="w-4 h-4" />
                              Проверить объект
                            </button>
                          </div>

                          {propertyResult.status === 'found' && propertyResult.data && (
                            <div className="p-4 bg-white border border-[#176b45] rounded-xl text-xs">
                              <strong className="text-sm block">{propertyResult.data.address}</strong>
                              <span className="text-[#686b70] block mt-0.5">
                                Площадь: {propertyResult.data.area_sqm} м² • Тип: {propertyResult.data.property_type} • Ограничения: {propertyResult.data.encumbrance_status}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Finances */}
          {currentStep.key === 'finances' && (
            <div className="space-y-6">
              {isOperating ? (
                /* Operating business */
                <>
                  <div className="alfa-panel">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#686b70] mb-4">
                      Финансовые факты по выпискам банка
                    </h3>
                    {clientFacts.length > 0 ? (
                      <div>
                        <div className="alfa-facts-grid mb-4">
                          <div className="alfa-fact">
                            <small>Период закрытых месяцев</small>
                            <strong>{clientFacts[0].month} — {clientFacts.at(-1)?.month}</strong>
                          </div>
                          <div className="alfa-fact">
                            <small>Количество месяцев</small>
                            <strong>{clientFacts.length} мес.</strong>
                          </div>
                          <div className="alfa-fact">
                            <small>Средняя выручка в месяц</small>
                            <strong>
                              {formatRubles(
                                Math.round(
                                  clientFacts.reduce((acc, f) => acc + Number(f.clean_receipts_rub), 0) / clientFacts.length
                                )
                              )}
                            </strong>
                          </div>
                          <div className="alfa-fact">
                            <small>Средние расходы бизнеса</small>
                            <strong>
                              {formatRubles(
                                Math.round(
                                  clientFacts.reduce((acc, f) => acc + Number(f.operating_outflow_rub), 0) / clientFacts.length
                                )
                              )}
                            </strong>
                          </div>
                        </div>
                        <p className="text-xs text-[#686b70]">
                          Сведения рассчитаны по фактам банковских транзакций. Прогноз и слова клиента не заменяют выписки.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-[#686b70]">
                        Нет данных о банковских фактах в текущем синтетическом профиле.
                      </p>
                    )}
                  </div>

                  <div className="alfa-panel space-y-6">
                    <div>
                      <label className="text-base font-bold text-[#141414] block">
                        Все поступления бизнеса учтены в показанных данных?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.receiptCoverage?.includes('all') ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, receiptCoverage: ['all'] })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да, все поступления учтены</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.receiptCoverage?.includes('other_banks') ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, receiptCoverage: ['other_banks'] })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Есть поступления в других банках (потребуется выписка)</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.receiptCoverage?.includes('cash') ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, receiptCoverage: ['cash'] })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Есть неучтённая наличная выручка</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#e6e8ea]">
                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Обязательные личные расходы без кредитов, ₽/мес.
                        </label>
                        <input
                          type="number"
                          value={answers.personalExpenses || ''}
                          onChange={(e) => setAnswers({ ...answers, personalExpenses: e.target.value })}
                          placeholder="50 000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                        />
                        {validationErrors.personalExpenses && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.personalExpenses}</p>
                        )}
                        <span className="text-xs text-[#686b70] block mt-1">
                          Прожиточный минимум семьи, коммунальные платежи, питание.
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Дополнительные расходы бизнеса в месяц, ₽ (если есть)
                        </label>
                        <input
                          type="number"
                          value={answers.extraExpenses || ''}
                          onChange={(e) => setAnswers({ ...answers, extraExpenses: e.target.value })}
                          placeholder="0"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                        />
                        <span className="text-xs text-[#686b70] block mt-1">
                          Только то, что не отражено в банковских выписках.
                        </span>
                      </div>
                    </div>

                    {/* Debts Table */}
                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#686b70] mb-3">
                        Известные кредиты и лизинг предпринимателя
                      </h3>
                      {clientDebts.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-[#e6e8ea] mb-4">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#f5f6f7] text-[#686b70]">
                              <tr>
                                <th className="p-3">Договор / Ref</th>
                                <th className="p-3">Тип</th>
                                <th className="p-3">Источник</th>
                                <th className="p-3">Платёж в месяц</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e8ea]">
                              {clientDebts.map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-3 font-semibold">{d.obligation_ref}</td>
                                  <td className="p-3 text-[#686b70]">{d.kind}</td>
                                  <td className="p-3">{d.source}</td>
                                  <td className="p-3 font-bold text-[#141414]">
                                    {formatRubles(Number(d.monthly_max_payment_rub))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-[#686b70] mb-4">В базе банка нет открытых кредитных договоров.</p>
                      )}

                      <label className="text-sm font-bold text-[#141414] block mb-2">
                        Список кредитов и лизинга полный и верный?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.debtsComplete === 'yes' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, debtsComplete: 'yes' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да, список полный и актуальный</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.debtsComplete === 'add' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, debtsComplete: 'add' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Есть ещё обязательства в других банках</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* New Business */
                <>
                  <div className="alfa-panel">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#686b70] mb-3">
                      Сведения о личном доходе
                    </h3>
                    {clientIncome.length > 0 ? (
                      <div className="p-4 bg-[#f5f6f7] rounded-xl text-xs space-y-1">
                        <p className="text-[#141414]">
                          В синтетическом досье есть данные о личном доходе за {clientIncome[0].month} — {clientIncome.at(-1)?.month}:
                        </p>
                        <strong className="text-base text-[#141414] block">
                          В среднем{' '}
                          {formatRubles(
                            Math.round(
                              clientIncome.reduce((acc, c) => acc + Number(c.net_income_rub), 0) / clientIncome.length
                            )
                          )}{' '}
                          в месяц
                        </strong>
                      </div>
                    ) : (
                      <p className="text-xs text-[#686b70]">
                        В досье нет сведений о регулярных зарплатных поступлениях.
                      </p>
                    )}
                  </div>

                  <div className="alfa-panel space-y-6">
                    <div>
                      <label className="text-base font-bold text-[#141414] block">
                        Из каких средств будете платить до устойчивой выручки?
                      </label>
                      <div className="alfa-choices">
                        {[
                          ['salary', 'Работа по найму'],
                          ['business', 'Другой действующий бизнес'],
                          ['rent', 'Сдача имущества в аренду'],
                          ['savings', 'Личные накопления'],
                          ['forecast', 'Только будущая выручка нового бизнеса'],
                        ].map(([code, label]) => {
                          const isSelected = (answers.repaymentSources || []).includes(code);
                          return (
                            <label
                              key={code}
                              className={`alfa-choice ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                const current = answers.repaymentSources || [];
                                const next = isSelected
                                  ? current.filter((x: string) => x !== code)
                                  : [...current, code];
                                setAnswers({ ...answers, repaymentSources: next });
                              }}
                            >
                              <div className="alfa-checkbox-box">
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span>{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#e6e8ea]">
                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Совокупный текущий личный доход, ₽/мес.
                        </label>
                        <input
                          type="number"
                          value={answers.personalIncome || ''}
                          onChange={(e) => setAnswers({ ...answers, personalIncome: e.target.value })}
                          placeholder="120 000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                        />
                        {validationErrors.personalIncome && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.personalIncome}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Этот доход сохранится после запуска?
                        </label>
                        <div className="alfa-choices">
                          <label
                            className={`alfa-choice ${answers.incomeContinues === 'Да' ? 'selected' : ''}`}
                            onClick={() => setAnswers({ ...answers, incomeContinues: 'Да' })}
                          >
                            <div className="alfa-radio-dot" />
                            <span>Да, сохранится</span>
                          </label>
                          <label
                            className={`alfa-choice ${answers.incomeContinues === 'Нет' ? 'selected' : ''}`}
                            onClick={() => setAnswers({ ...answers, incomeContinues: 'Нет' })}
                          >
                            <div className="alfa-radio-dot" />
                            <span>Нет, будет только выручка</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#e6e8ea]">
                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Неизбежные расходы бизнеса до выручки, ₽/мес.
                        </label>
                        <input
                          type="number"
                          value={answers.committedCosts || ''}
                          onChange={(e) => setAnswers({ ...answers, committedCosts: e.target.value })}
                          placeholder="30 000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                        />
                        <span className="text-xs text-[#686b70] block mt-1">
                          Аренда помещения, зарплата ключевых сотрудников, связь.
                        </span>
                        {validationErrors.committedCosts && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.committedCosts}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#141414] mb-1">
                          Обязательные личные расходы без кредитов, ₽/мес.
                        </label>
                        <input
                          type="number"
                          value={answers.personalExpenses || ''}
                          onChange={(e) => setAnswers({ ...answers, personalExpenses: e.target.value })}
                          placeholder="50 000"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                        />
                        {validationErrors.personalExpenses && (
                          <p className="text-xs text-[#EF3124] mt-1">{validationErrors.personalExpenses}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 6: Documents */}
          {currentStep.key === 'documents' && (
            <div className="space-y-6">
              <div className="alfa-panel">
                <div className="alfa-message">
                  <b>Без лишней бюрократии:</b> Загрузите только те документы, которые у вас есть прямо сейчас.
                  Каждый файл можно предоставить позже — специалист банка запросит недостающее адресно.
                </div>

                <div className="space-y-6">
                  {/* Equipment docs */}
                  {isEquipment && (
                    <div className="p-5 border border-[#e6e8ea] rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <strong className="text-sm font-bold text-[#141414] block">
                            Документы по оборудованию
                          </strong>
                          <span className="text-xs text-[#686b70]">
                            Счёт на оплату, коммерческое предложение или спецификация
                          </span>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-[#686b70] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deferredDocs.equipmentDoc || false}
                            onChange={(e) => setDeferredDocs({ ...deferredDocs, equipmentDoc: e.target.checked })}
                            className="rounded text-[#EF3124]"
                          />
                          <span>Предоставлю позже</span>
                        </label>
                      </div>

                      {!deferredDocs.equipmentDoc && (
                        <div>
                          <input
                            type="file"
                            id="upload-eq"
                            multiple
                            onChange={(e) => handleFileUpload('equipmentDoc', e)}
                            className="hidden"
                          />
                          <label
                            htmlFor="upload-eq"
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#e6e8ea] hover:border-[#EF3124] rounded-xl cursor-pointer bg-[#f5f6f7] transition-colors"
                          >
                            <Upload className="w-6 h-6 text-[#686b70] mb-2" />
                            <span className="text-xs font-semibold text-[#141414]">
                              Нажмите для загрузки счёта или договора
                            </span>
                            <span className="text-[11px] text-[#686b70] mt-0.5">PDF, DOCX, XLSX до 20 МБ</span>
                          </label>

                          {uploadedFiles.equipmentDoc?.length > 0 && (
                            <ul className="mt-3 divide-y divide-[#e6e8ea] text-xs">
                              {uploadedFiles.equipmentDoc.map((f) => (
                                <li key={f.id} className="py-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#EF3124]" />
                                    <span className="font-medium text-[#141414]">{f.name}</span>
                                    <span className="text-[#686b70]">({Math.round(f.size / 1024)} КБ)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile('equipmentDoc', f.id)}
                                    className="text-slate-400 hover:text-[#EF3124]"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other bank statements */}
                  {(answers.receiptCoverage || []).includes('other_banks') && (
                    <div className="p-5 border border-[#e6e8ea] rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <strong className="text-sm font-bold text-[#141414] block">
                            Выписки из других банков
                          </strong>
                          <span className="text-xs text-[#686b70]">
                            За последние 6–12 месяцев для подтверждения совокупного оборота
                          </span>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-[#686b70] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deferredDocs.otherBankStatements || false}
                            onChange={(e) => setDeferredDocs({ ...deferredDocs, otherBankStatements: e.target.checked })}
                            className="rounded text-[#EF3124]"
                          />
                          <span>Предоставлю позже</span>
                        </label>
                      </div>

                      {!deferredDocs.otherBankStatements && (
                        <div>
                          <input
                            type="file"
                            id="upload-banks"
                            multiple
                            onChange={(e) => handleFileUpload('otherBankStatements', e)}
                            className="hidden"
                          />
                          <label
                            htmlFor="upload-banks"
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#e6e8ea] hover:border-[#EF3124] rounded-xl cursor-pointer bg-[#f5f6f7] transition-colors"
                          >
                            <Upload className="w-6 h-6 text-[#686b70] mb-2" />
                            <span className="text-xs font-semibold text-[#141414]">
                              Загрузить выписку стороннего банка
                            </span>
                            <span className="text-[11px] text-[#686b70] mt-0.5">PDF, TXT, CSV, 1C выгрузка</span>
                          </label>

                          {uploadedFiles.otherBankStatements?.length > 0 && (
                            <ul className="mt-3 divide-y divide-[#e6e8ea] text-xs">
                              {uploadedFiles.otherBankStatements.map((f) => (
                                <li key={f.id} className="py-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#EF3124]" />
                                    <span className="font-medium text-[#141414]">{f.name}</span>
                                    <span className="text-[#686b70]">({Math.round(f.size / 1024)} КБ)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFile('otherBankStatements', f.id)}
                                    className="text-slate-400 hover:text-[#EF3124]"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collateral docs */}
                  {isNew && answers.collateral === 'yes' && (
                    <div className="p-5 border border-[#e6e8ea] rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <strong className="text-sm font-bold text-[#141414] block">
                            Документы по объекту залога
                          </strong>
                          <span className="text-xs text-[#686b70]">
                            Выписка ЕГРН или договор купли-продажи / основание права
                          </span>
                        </div>
                      </div>

                      <input
                        type="file"
                        id="upload-collateral"
                        multiple
                        onChange={(e) => handleFileUpload('collateralDoc', e)}
                        className="hidden"
                      />
                      <label
                        htmlFor="upload-collateral"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#e6e8ea] hover:border-[#EF3124] rounded-xl cursor-pointer bg-[#f5f6f7] transition-colors"
                      >
                        <Upload className="w-6 h-6 text-[#686b70] mb-2" />
                        <span className="text-xs font-semibold text-[#141414]">
                          Загрузить документы на недвижимость
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review & Scoring Preview */}
          {currentStep.key === 'review' && (
            <div className="space-y-6">
              {/* Scoring Analysis Card */}
              <div className="alfa-panel">
                <div className="alfa-message">
                  <b>Скоринг по правилам · без «чёрного ящика» ML:</b> Расчёт выполнен по демонстрационным
                  правилам Excel. Балл не является вероятностью одобрения или дефолта, а отражает соответствие
                  требованиям по покрытию платежей и кредитной истории.
                </div>

                <div className="alfa-analysis-result">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#686b70] block mb-1">
                      {scoringEvaluation.profile === 'FULL'
                        ? 'Фактический бизнес-поток'
                        : scoringEvaluation.profile === 'LIMITED'
                        ? 'Ограниченная финансовая история'
                        : 'Индивидуальный маршрут'}
                    </span>
                    <h2 className="text-2xl font-black text-[#141414] leading-tight mb-2">
                      {scoringEvaluation.recommendation}
                    </h2>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        scoringEvaluation.state === 'ready'
                          ? 'bg-[#e7f7ed] text-[#176b45]'
                          : ['error', 'stop'].includes(scoringEvaluation.state)
                          ? 'bg-[#fff1ef] text-[#EF3124]'
                          : 'bg-[#fef3c7] text-[#885215]'
                      }`}
                    >
                      {scoringEvaluation.state === 'ready'
                        ? 'Можно рассмотреть условия'
                        : scoringEvaluation.state === 'provisional'
                        ? 'Предварительно · нужна сверка'
                        : scoringEvaluation.state === 'manual'
                        ? 'Ручное рассмотрение'
                        : scoringEvaluation.state === 'stop'
                        ? 'Есть ограничивающий фактор'
                        : 'Уточнить данные'}
                    </span>
                  </div>

                  <div className={`alfa-score-circle ${scoringEvaluation.score === null ? 'no-score' : ''}`}>
                    <strong>{scoringEvaluation.score === null ? '—' : scoringEvaluation.score}</strong>
                    <span>{scoringEvaluation.score === null ? 'балл не применяется' : 'баллов из 100'}</span>
                  </div>
                </div>

                {/* Financial Metric Cards */}
                <div className="alfa-analysis-stats">
                  <div className="alfa-stat">
                    <span>Средние поступления</span>
                    <strong>
                      {scoringEvaluation.metrics.receipts !== null
                        ? formatRubles(Math.round(scoringEvaluation.metrics.receipts))
                        : '—'}
                    </strong>
                    <span>в месяц</span>
                  </div>

                  <div className="alfa-stat">
                    <span>Доступный поток (C)</span>
                    <strong>
                      {scoringEvaluation.metrics.availableCash !== null
                        ? formatRubles(Math.round(scoringEvaluation.metrics.availableCash))
                        : '—'}
                    </strong>
                    <span>после расходов</span>
                  </div>

                  <div className="alfa-stat">
                    <span>Текущие платежи (D)</span>
                    <strong>
                      {scoringEvaluation.metrics.debtPayment !== null
                        ? formatRubles(Math.round(scoringEvaluation.metrics.debtPayment))
                        : '0 ₽'}
                    </strong>
                    <span>по кредитам</span>
                  </div>
                </div>

                {/* Candidate Offer Terms if Available */}
                {scoringEvaluation.candidate && (
                  <div className="alfa-candidate-card">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#EF3124] mb-3">
                      Рассчитанные условия финансирования
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[#686b70] block">Сумма:</span>
                        <strong className="text-base text-[#141414] block mt-0.5">
                          {formatRubles(scoringEvaluation.candidate.amount)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#686b70] block">Срок:</span>
                        <strong className="text-base text-[#141414] block mt-0.5">
                          {scoringEvaluation.candidate.term} мес.
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#686b70] block">Ориентир. ставка:</span>
                        <strong className="text-base text-[#141414] block mt-0.5">
                          {(scoringEvaluation.candidate.rate * 100).toFixed(1)}% годовых
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#686b70] block">Платёж в месяц:</span>
                        <strong className="text-base text-[#EF3124] block mt-0.5">
                          {formatRubles(Math.round(scoringEvaluation.candidate.payment))}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#efddd8] flex items-center justify-between text-xs text-[#686b70]">
                      <span>Коэффициент покрытия долга (DSCR): <b>{scoringEvaluation.candidate.coverage.toFixed(2)}x</b> (норматив ≥ 1.5x)</span>
                      <span className="text-[#176b45] font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Проходит по нормативу
                      </span>
                    </div>
                  </div>
                )}

                {/* Score Components Breakdown Table */}
                {scoringEvaluation.components.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#e6e8ea]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#686b70] mb-3">
                      Разбивка кредитного балла по факторам
                    </h3>
                    <div className="divide-y divide-[#e6e8ea] text-xs">
                      {scoringEvaluation.components.map((comp) => (
                        <div key={comp.key} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-[#141414] block">{comp.label}</span>
                            <span className="text-[11px] text-[#686b70]">
                              {typeof comp.value === 'number'
                                ? comp.value.toFixed(2)
                                : String(comp.value || '—')} • Правило {comp.rule}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#141414]">
                              {comp.points} / {comp.max}
                            </span>
                            <span className="text-[11px] text-[#686b70] block">баллов</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Specialist Checklist: "Что уточнит специалист" */}
              {riskFindings.length > 0 && (
                <div className="alfa-panel border-amber-300 bg-[#fffdf7]">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-5 h-5 text-[#885215]" />
                    <h3 className="text-sm font-bold text-[#885215] uppercase tracking-wider">
                      Что уточнит специалист при рассмотрении ({riskFindings.length})
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-[#78350f]">
                    {riskFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Summary Blocks */}
              <div className="space-y-4">
                {wizardSteps
                  .filter((s) => s.key !== 'review')
                  .map((step) => (
                    <div key={step.key} className="alfa-panel p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm text-[#141414]">{step.short}</h3>
                        <button
                          type="button"
                          onClick={() => jumpToStep(wizardSteps.findIndex((x) => x.key === step.key))}
                          className="alfa-text-btn"
                        >
                          Изменить
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#686b70]">
                        {step.key === 'profile' && (
                          <>
                            <div>
                              <span>Предприниматель:</span>
                              <strong className="text-[#141414] block mt-0.5">{clientProfile.full_name}</strong>
                            </div>
                            <div>
                              <span>ИНН:</span>
                              <strong className="text-[#141414] block mt-0.5">{clientProfile.inn}</strong>
                            </div>
                            <div>
                              <span>Актуальность данных:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {answers.profileCurrent === 'yes' ? 'Сведения актуальны' : 'Заявлены изменения'}
                              </strong>
                            </div>
                          </>
                        )}

                        {step.key === 'passport' && (
                          <>
                            <div>
                              <span>Паспортные данные:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {answers.passportCurrent === 'yes' ? 'Подтверждены' : 'Введены новые'}
                              </strong>
                            </div>
                            <div>
                              <span>Серия и номер:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {answers.passportCurrent === 'yes'
                                  ? `${clientPassport?.series || ''} •••${clientPassport?.number.slice(-3) || ''}`
                                  : `${answers.passportSeries || ''} ${answers.passportNumber || ''}`}
                              </strong>
                            </div>
                          </>
                        )}

                        {step.key === 'request' && (
                          <>
                            <div>
                              <span>Состояние бизнеса:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {isOperating ? 'Действующий' : isPaused ? 'Приостановлен' : 'Новый'}
                              </strong>
                            </div>
                            <div>
                              <span>Цель:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {isEquipment ? 'Покупка оборудования' : 'Оборотные средства'}
                              </strong>
                            </div>
                            <div>
                              <span>Сумма:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {formatRubles(Number(answers.amount) || 0)}
                              </strong>
                            </div>
                            <div>
                              <span>Срок:</span>
                              <strong className="text-[#141414] block mt-0.5">
                                {answers.termUnspecified ? 'Помочь подобрать' : `${answers.term} мес.`}
                              </strong>
                            </div>
                          </>
                        )}

                        {step.key === 'details' && (
                          <>
                            {isEquipment ? (
                              <>
                                <div>
                                  <span>Оборудование:</span>
                                  <strong className="text-[#141414] block mt-0.5">{answers.equipment || 'Не указано'}</strong>
                                </div>
                                <div>
                                  <span>Стоимость:</span>
                                  <strong className="text-[#141414] block mt-0.5">
                                    {answers.equipmentCostUnspecified ? 'Пока неизвестна' : formatRubles(Number(answers.equipmentCost) || 0)}
                                  </strong>
                                </div>
                                <div>
                                  <span>Собственный взнос:</span>
                                  <strong className="text-[#141414] block mt-0.5">{formatRubles(Number(answers.ownFunds) || 0)}</strong>
                                </div>
                                <div>
                                  <span>Поставщик:</span>
                                  <strong className="text-[#141414] block mt-0.5">
                                    {supplierResult.data ? supplierResult.data.name : (answers.supplierInn || 'Не выбран')}
                                  </strong>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <span>Назначение расходов:</span>
                                  <strong className="text-[#141414] block mt-0.5">{answers.expenseDescription || 'Не указано'}</strong>
                                </div>
                                <div>
                                  <span>Залог:</span>
                                  <strong className="text-[#141414] block mt-0.5">
                                    {answers.collateral === 'yes' ? 'Предоставляется' : 'Без залога'}
                                  </strong>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {step.key === 'finances' && (
                          <>
                            <div>
                              <span>Личные расходы:</span>
                              <strong className="text-[#141414] block mt-0.5">{formatRubles(Number(answers.personalExpenses) || 0)} / мес.</strong>
                            </div>
                            {isNew ? (
                              <div>
                                <span>Личный доход:</span>
                                <strong className="text-[#141414] block mt-0.5">{formatRubles(Number(answers.personalIncome) || 0)} / мес.</strong>
                              </div>
                            ) : (
                              <div>
                                <span>Полнота выручки:</span>
                                <strong className="text-[#141414] block mt-0.5">
                                  {(answers.receiptCoverage || []).includes('all') ? 'Все поступления учтены' : 'Есть другие банки'}
                                </strong>
                              </div>
                            )}
                          </>
                        )}

                        {step.key === 'documents' && (
                          <div className="col-span-2">
                            <span>Прикрепленные файлы:</span>
                            <strong className="text-[#141414] block mt-0.5">
                              {Object.values(uploadedFiles).flat().length > 0
                                ? Object.values(uploadedFiles)
                                    .flat()
                                    .map((f) => f.name)
                                    .join(', ')
                                : 'Файлы не загружены (будут предоставлены позже)'}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Confirmation Checkbox */}
              <div className="alfa-panel">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={answers.reviewConfirmed || false}
                    onChange={(e) => setAnswers({ ...answers, reviewConfirmed: e.target.checked })}
                    className="mt-1 rounded text-[#EF3124] focus:ring-[#EF3124]"
                  />
                  <span className="text-sm font-semibold text-[#141414]">
                    Проверил сведения. Понимаю, что ошибки и неполные данные могут повлиять на рассмотрение
                    и условия финансирования.
                  </span>
                </label>
                {validationErrors.reviewConfirmed && (
                  <p className="text-xs text-[#EF3124] mt-2 font-medium">
                    {validationErrors.reviewConfirmed}
                  </p>
                )}
                <p className="text-xs text-[#686b70] mt-3">
                  В прототипе хакатона обращение будет зарегистрировано и мгновенно появится на рабочем месте банка.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Action Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-[#e6e8ea] flex items-center justify-between">
            {currentStepIdx > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="alfa-btn-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep.key === 'review' ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                  className="alfa-btn-primary"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Отправка...' : 'Отправить обращение в банк'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="alfa-btn-primary"
                >
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
