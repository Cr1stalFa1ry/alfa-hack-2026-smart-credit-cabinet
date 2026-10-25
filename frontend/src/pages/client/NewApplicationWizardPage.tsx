import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { clientApi, CompanyLookupResponse } from '../../api/clientApi';
import { CreditApplication } from '../../types/application';
import { useAuth } from '../../context/AuthContext';
import {
  ALFA_DATA,
  DemoApplication,
  DemoPassport,
  DemoFact,
  DemoDebt,
  DemoIncome,
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
import { ConsentModal, ConsentType } from '../../components/application/ConsentModal';
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
  ShieldCheck,
  Building2,
  ExternalLink,
  Calendar,
  Download,
  Save,
  Sparkles,
} from 'lucide-react';

interface UploadedFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  group: string;
  url?: string;
  file?: File;
}

const buildInitialAnswersForClient = (app: Partial<DemoApplication> & { inn?: string; phone?: string; full_name?: string }) => {
  const isOperating = app.stage === 'operating';
  const hasActiveBki = app.bki_consent === 'да';
  const bkiValidUntil = hasActiveBki
    ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  return {
    // Step 1: Profile & ПДн
    profileCurrent: 'yes',
    phone: app.phone || '',
    email: app.email || '',
    profileChanges: '',
    personalDataConsent: false,
    personalDataConsentDate: undefined,
    // Step 2: Passport
    passportCurrent: 'yes',
    passportName: app.full_name || '',
    passportSeries: '',
    passportNumber: '',
    passportBirth: '',
    passportIssued: '',
    passportIssuer: '',
    passportCode: '',
    // Step 3: Request
    business: isOperating ? 'operating' : app.stage === 'paused' ? 'paused' : 'new',
    purpose: app.purpose === 'equipment' ? 'equipment' : 'working_capital',
    amount: String(app.amount_rub || 1000000),
    term: String(app.requested_term_months || 12),
    termUnspecified: false,
    activity: '',
    launchMonth: '',
    launchMonthUnspecified: false,
    // Step 4: Details & Лизинговый партнёр
    leasing: 'yes',
    leasingPartnerConsent: false,
    leasingPartnerName: 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
    leasingPartnerConsentDate: undefined,
    equipment: '',
    equipmentChosen: 'Да',
    equipmentCost: '',
    equipmentCostUnspecified: false,
    costIncludes: 'Доставка и пусконаладочные работы',
    ownFunds: '0',
    supplierChosen: 'Нет',
    supplierInn: '',
    purchaseDate: '',
    expenseType: 'goods',
    expenseDescription: '',
    expensePeriod: '',
    hasContract: 'Да',
    paymentDate: '',
    collateral: 'no',
    propertyInput: 'cadastre',
    cadastralNumber: '',
    // Step 5: Finances & БКИ
    hasExistingActiveBkiConsent: hasActiveBki,
    bkiConsent: hasActiveBki,
    bkiConsentDate: hasActiveBki ? new Date().toISOString() : undefined,
    bkiConsentValidUntil: bkiValidUntil,
    taxCurrent: 'yes',
    taxRegimes: [app.tax_regime || 'УСН (доходы)'],
    taxOther: '',
    receiptCoverage: ['all'],
    otherBanks: '',
    cashAmount: '',
    expensesComplete: 'yes',
    extraExpensesDetails: '',
    extraExpenses: '',
    additionalIncome: 'Нет',
    otherIncomeSource: '',
    personalExpenses: app.household_expenses_monthly_rub ? String(Math.round(Number(app.household_expenses_monthly_rub))) : '50000',
    debtsComplete: 'yes',
    debtChanges: '',
    extraDebts: [],
    repaymentSources: ['revenue'],
    personalIncome: '',
    incomeContinues: 'Да',
    committedCosts: '0',
    cashReserve: '0',
    repaymentDescription: 'За счёт регулярной выручки от текущей операционной деятельности',
    // Step 7: Review
    reviewConfirmed: false,
  };
};

export interface NewApplicationWizardPageProps {
  draftId?: string;
  initialApplication?: CreditApplication;
  onSubmitted?: (submittedId: string) => void;
}

export const NewApplicationWizardPage: React.FC<NewApplicationWizardPageProps> = ({
  draftId: propDraftId,
  initialApplication,
  onSubmitted,
}) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const draftIdParam = propDraftId || initialApplication?.id || routeId || searchParams.get('draftId') || null;
  const { user } = useAuth();

  // ----------------------------------------------------
  // ИНН и сведения из SyntheticDb
  // ----------------------------------------------------
  const [selectedInn, setSelectedInn] = useState<string>(() => user?.inn || '');
  const [isLoadingDossier, setIsLoadingDossier] = useState<boolean>(false);
  const [dossierFound, setDossierFound] = useState<boolean | null>(null);
  const [lookupData, setLookupData] = useState<CompanyLookupResponse | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(() => draftIdParam || null);
  const [statementMlResult, setStatementMlResult] = useState<{
    status: string;
    metrics?: {
      avgMonthlyRevenueRub: number;
      avgMonthlyExpensesRub: number;
      avgMonthlyNetRub: number;
      avgMonthlyLoanPaymentsRub: number;
      revenueCv: number;
      monthsCount: number;
      annualRevenueRub: number;
    };
    reason?: string;
    message?: string;
    fileName?: string;
  } | null>(null);
  const [isAnalyzingStatement, setIsAnalyzingStatement] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const isAutoCreatingDraftRef = useRef<boolean>(false);
  const justCreatedDraftIdRef = useRef<string | null>(null);

  const fetchDossier = async (innToFetch: string) => {
    const clean = innToFetch.trim();
    if (clean.length !== 12) {
      setDossierFound(null);
      setLookupData(null);
      return;
    }
    setIsLoadingDossier(true);
    try {
      const data = await clientApi.lookupCompany(clean);
      if (data && data.inn) {
        setLookupData(data);
        setDossierFound(true);
        setAnswers((prev) => ({
          ...prev,
          passportName: data.fullName || prev.passportName,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          passportSeries: data.passportSeries || prev.passportSeries,
          passportNumber: data.passportNumber || prev.passportNumber,
          passportBirth: data.passportBirthDate || prev.passportBirth,
          passportIssued: data.passportIssueDate || prev.passportIssued,
          passportIssuer: data.passportIssuer || prev.passportIssuer,
          passportCode: data.passportDepartmentCode || prev.passportCode,
          taxRegimes: data.taxRegime ? [data.taxRegime] : prev.taxRegimes,
          business: data.suggestedStage === 'prelaunch' ? 'new' : (data.suggestedStage || 'operating'),
        }));
      } else {
        setLookupData(null);
        setDossierFound(false);
      }
    } catch {
      setLookupData(null);
      setDossierFound(false);
    } finally {
      setIsLoadingDossier(false);
    }
  };

  useEffect(() => {
    if (!draftIdParam) {
      const innToUse = selectedInn || user?.inn || '500100000011';
      if (innToUse && innToUse.length === 12) {
        if (!selectedInn) setSelectedInn(innToUse);
        fetchDossier(innToUse);
      }

      // Как только клиент переходит на страницу создания анкеты client/new сразу же создаётся черновик
      if (!isAutoCreatingDraftRef.current && !currentDraftId) {
        isAutoCreatingDraftRef.current = true;
        const createInitialDraft = async () => {
          try {
            const initialInn = innToUse || user?.inn || '500100000011';
            const payload = {
              inn: initialInn,
              businessType: 'operating',
              stage: 'operating',
              purpose: 'Пополнение оборотных средств',
              purposeCode: 'working_capital',
              productCode: 'WC',
              requestedAmount: 1000000,
              requestedTermMonths: 12,
              ownContribution: 0,
              asSoonAsPossible: true,
              bkiConsent: false,
              personalDataConsent: false,
            };
            const created = await clientApi.createDraft(payload as any);
            justCreatedDraftIdRef.current = created.id;
            setCurrentDraftId(created.id);
            navigate(`/client/new?draftId=${created.id}`, { replace: true });
          } catch (e) {
            console.error('Ошибка автоматического создания черновика при входе в /client/new:', e);
            isAutoCreatingDraftRef.current = false;
          }
        };
        createInitialDraft();
      }
      return;
    }

    if (justCreatedDraftIdRef.current === draftIdParam) {
      return;
    }

    let isCancelled = false;
    const loadDraft = async () => {
      setIsLoadingDossier(true);
      try {
        const app =
          initialApplication && initialApplication.id === draftIdParam
            ? initialApplication
            : await clientApi.getApplicationById(draftIdParam);
        if (isCancelled) return;

        isInitializedRef.current = true;
        setCurrentDraftId(app.id);

        if (app.inn) {
          setSelectedInn(app.inn);
          await fetchDossier(app.inn);
        }

        // 1. Создаем дефолтные ответы анкеты для профиля заявителя
        const innToUse = app.inn || user?.inn || '';
        const defaultAnswers = buildInitialAnswersForClient({
          inn: innToUse,
          full_name: app.companyName || user?.fullName || (innToUse ? `ИП (ИНН ${innToUse})` : '—'),
          phone: user?.username || '',
          stage: app.stage || 'operating',
          purpose: app.purposeCode || 'working_capital',
          amount_rub: app.requestedAmount || 1000000,
          requested_term_months: app.requestedTermMonths || 12,
        });

        // 2. Проверяем сохраненные ответы анкеты в локальном хранилище
        let cachedAnswers: Record<string, any> = {};
        const cached = localStorage.getItem(`draft_answers_${draftIdParam}`);
        if (cached) {
          try {
            cachedAnswers = JSON.parse(cached);
          } catch {}
        }

        setAnswers((prev) => {
          const merged: Record<string, any> = { ...defaultAnswers, ...prev, ...cachedAnswers };
          if (app.clientAnswers && typeof app.clientAnswers === 'object') {
            Object.assign(merged, app.clientAnswers);
          }
          if (app.requestedAmount) merged.amount = String(Math.round(app.requestedAmount));
          if (app.requestedTermMonths) merged.term = String(app.requestedTermMonths);
          if (app.stage) merged.business = app.stage === 'prelaunch' ? 'new' : 'operating';
          if (app.purposeCode) merged.purpose = app.purposeCode;
          if (app.ownContribution) merged.ownFunds = String(Math.round(app.ownContribution));
          if (app.equipmentPrice) merged.equipmentCost = String(Math.round(app.equipmentPrice));
          if (app.equipmentSupplier) merged.supplierInn = app.equipmentSupplier;
          if (app.neededByDate) merged.paymentDate = app.neededByDate.split('T')[0];
          if (app.expensePeriod) merged.expensePeriod = app.expensePeriod;
          if (app.hasExpenseContract !== undefined) merged.hasContract = app.hasExpenseContract ? 'Да' : 'Нет';
          if (app.isTaxRegimeActual !== undefined) merged.taxCurrent = app.isTaxRegimeActual ? 'yes' : 'change';
          if (app.declaredTaxRegime) merged.taxRegimes = [app.declaredTaxRegime];
          if (app.receiptCoverage && app.receiptCoverage.length > 0) merged.receiptCoverage = app.receiptCoverage;
          if (app.expensesCoverageStatus) merged.expensesComplete = app.expensesCoverageStatus;
          if (app.hasAdditionalIncome !== undefined) merged.additionalIncome = app.hasAdditionalIncome ? 'Да' : 'Нет';
          if (app.additionalIncomeAmount) merged.personalIncome = String(Math.round(app.additionalIncomeAmount));
          if (app.debtsVerificationStatus) merged.debtsComplete = app.debtsVerificationStatus;
          if (app.repaymentSourceDescription) merged.repaymentDescription = app.repaymentSourceDescription;
          if (app.householdExpenses) merged.personalExpenses = String(Math.round(app.householdExpenses));
          if (app.personalDataConsent !== undefined) merged.personalDataConsent = app.personalDataConsent;
          if (app.personalDataConsentDate) merged.personalDataConsentDate = app.personalDataConsentDate;
          if (app.bkiConsent !== undefined) merged.bkiConsent = app.bkiConsent;
          if (app.bkiConsentDate) merged.bkiConsentDate = app.bkiConsentDate;
          if (app.bkiConsentValidUntil) merged.bkiConsentValidUntil = app.bkiConsentValidUntil;
          if (app.leasingPartnerConsent !== undefined) merged.leasingPartnerConsent = app.leasingPartnerConsent;
          if (app.leasingPartnerName) merged.leasingPartnerName = app.leasingPartnerName;
          if (app.leasingPartnerConsentDate) merged.leasingPartnerConsentDate = app.leasingPartnerConsentDate;

          return merged;
        });

        // Восстановление ранее прикрепленных документов по черновику
        if (app.documents && Array.isArray(app.documents) && app.documents.length > 0) {
          const restored: Record<string, UploadedFileMeta[]> = {};
          app.documents.forEach((d) => {
            const grp = d.fileType === 'bank_statement' ? 'statements' : (d.fileType || 'other');
            restored[grp] = restored[grp] || [];
            restored[grp].push({
              id: d.id,
              name: d.fileName,
              size: d.fileSizeBytes,
              type: d.fileType,
              group: grp,
              url: d.downloadUrl,
            });
          });
          setUploadedFiles((prev) => ({ ...restored, ...prev }));
        }
      } catch (e) {
        console.error('Ошибка загрузки черновика:', e);
      } finally {
        if (!isCancelled) setIsLoadingDossier(false);
      }
    };

    loadDraft();

    return () => {
      isCancelled = true;
    };
  }, [draftIdParam, user?.inn]);

  const clientProfile = useMemo<DemoApplication>(() => {
    if (lookupData) {
      return {
        application_id: `APP-${lookupData.inn.slice(-4)}`,
        full_name: lookupData.fullName || user?.fullName || `ИП (ИНН ${lookupData.inn})`,
        inn: lookupData.inn,
        ogrnip: lookupData.ogrnip || '—',
        registration_date: lookupData.registrationDate ? lookupData.registrationDate.split('T')[0] : '—',
        okved_main: lookupData.okvedMain ? `${lookupData.okvedMain} ${lookupData.okvedMainName || ''}`.trim() : '—',
        registry_status: lookupData.egripStatus || 'ACTIVE',
        phone: lookupData.phone || user?.username || '',
        email: lookupData.email || '',
        stage: lookupData.suggestedStage || 'operating',
        purpose: 'working_capital',
        amount_rub: 1000000,
        requested_term_months: 12,
        tax_regime: lookupData.taxRegime || 'УСН (доходы)',
        own_bank_client: lookupData.isAlfaClient ? 'да' : 'нет',
        applicant_match: 'PASS',
        activity_first_full_month: lookupData.registrationDate ? lookupData.registrationDate.slice(0, 7) : '2022-01',
      };
    }

    return {
      application_id: selectedInn ? `APP-${selectedInn.slice(-4)}` : 'APP-0000',
      full_name: user?.fullName || (selectedInn ? `ИП (ИНН ${selectedInn})` : '—'),
      inn: selectedInn || '—',
      ogrnip: '—',
      registration_date: '—',
      okved_main: '—',
      registry_status: selectedInn ? 'NOT_FOUND' : '—',
      phone: '',
      email: '',
      stage: 'operating',
      purpose: 'working_capital',
      amount_rub: 1000000,
      requested_term_months: 12,
      tax_regime: 'УСН (доходы)',
      own_bank_client: 'нет',
      applicant_match: 'PASS',
      activity_first_full_month: '2023-01',
    };
  }, [lookupData, selectedInn, user]);

  const clientPassport = useMemo<DemoPassport | undefined>(() => {
    if (lookupData?.passportSeries && lookupData?.passportNumber) {
      return {
        applicant_inn: lookupData.inn,
        full_name: lookupData.fullName || clientProfile.full_name,
        series: lookupData.passportSeries,
        number: lookupData.passportNumber,
        birth_date: lookupData.passportBirthDate || '',
        issue_date: lookupData.passportIssueDate || '',
        issuer: lookupData.passportIssuer || '',
        department_code: lookupData.passportDepartmentCode || '',
      };
    }
    return undefined;
  }, [lookupData, clientProfile]);

  const clientFacts = useMemo<DemoFact[]>(() => {
    if (lookupData?.facts && lookupData.facts.length > 0) {
      return lookupData.facts.map((f) => ({
        application_id: clientProfile.application_id,
        month: f.month,
        clean_receipts_rub: f.cleanReceiptsRub,
        operating_outflow_rub: f.operatingOutflowRub,
      }));
    }
    return [];
  }, [lookupData, clientProfile]);

  const clientDebts = useMemo<DemoDebt[]>(() => {
    if (lookupData?.debts && lookupData.debts.length > 0) {
      return lookupData.debts.map((d) => ({
        application_id: clientProfile.application_id,
        source: 'Синтетическая база банка',
        obligation_ref: d.obligationRef || 'Обязательство',
        kind: 'Кредит',
        monthly_max_payment_rub: d.monthlyMaxPaymentRub,
      }));
    }
    return [];
  }, [lookupData, clientProfile]);

  const clientIncome = useMemo<DemoIncome[]>(() => {
    return [];
  }, []);

  // ----------------------------------------------------
  // Состояние ответов анкеты
  // ----------------------------------------------------
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileMeta[]>>({});
  const [deferredDocs, setDeferredDocs] = useState<Record<string, boolean>>({});
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [activeConsentType, setActiveConsentType] = useState<ConsentType | null>(null);

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

  // Инициализация по умолчанию при первичном входе (НЕ затирает уже введённые пользователем данные!)
  const initForClient = (app: DemoApplication, force = false) => {
    setAnswers((prev) => {
      if (!force && Object.keys(prev).length > 0) {
        return {
          ...prev,
          phone: prev.phone || app.phone || '',
          email: prev.email || app.email || '',
          passportName: prev.passportName || app.full_name || '',
        };
      }
      return buildInitialAnswersForClient(app);
    });
  };

  useEffect(() => {
    // Если форма уже загрузила черновик или была инициализирована — не трогаем пользовательские данные!
    if (draftIdParam || isInitializedRef.current) return;

    initForClient(clientProfile, true);
    isInitializedRef.current = true;
  }, [clientProfile, draftIdParam]);

  // Helpers
  const isOperating = answers.business === 'operating';
  const isNew = answers.business === 'new';
  const isPaused = answers.business === 'paused';
  const isEquipment = answers.purpose === 'equipment';

  // Обработка принятия согласий из отдельного модального окна
  const handleAcceptConsent = (type: ConsentType | null) => {
    const now = new Date().toISOString();
    if (type === 'pdn') {
      setAnswers((prev) => ({
        ...prev,
        personalDataConsent: true,
        personalDataConsentDate: now,
      }));
      setValidationErrors((errs) => {
        const next = { ...errs };
        delete next.personalDataConsent;
        return next;
      });
    } else if (type === 'bki') {
      const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
      setAnswers((prev) => ({
        ...prev,
        bkiConsent: true,
        bkiConsentDate: now,
        bkiConsentValidUntil: validUntil,
      }));
      setValidationErrors((errs) => {
        const next = { ...errs };
        delete next.bkiConsent;
        return next;
      });
    } else if (type === 'leasing') {
      setAnswers((prev) => ({
        ...prev,
        leasingPartnerConsent: true,
        leasingPartnerName: 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
        leasingPartnerConsentDate: now,
      }));
      setValidationErrors((errs) => {
        const next = { ...errs };
        delete next.leasingPartnerConsent;
        return next;
      });
    }
  };

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
  // Выявление рисков / "Что уточнит специалист" (соответствует findings() из макет.html)
  // ----------------------------------------------------
  const riskFindings = useMemo<string[]>(() => {
    const out: string[] = [];
    const add = (condition: boolean | any, text: string) => {
      if (condition) out.push(text);
    };

    add(answers.profileCurrent === 'change', 'Изменены сведения ИП: проверить досье');
    add(answers.passportCurrent === 'change', 'Введён новый паспорт: требуется проверка');
    add(clientProfile.registry_status !== 'ACTIVE', 'Статус регистрации ИП требует отдельного рассмотрения');
    add(clientProfile.applicant_match === 'нет', 'В исходном наборе есть расхождение идентификации');
    add(isPaused, 'Бизнес приостановлен: индивидуальная консультация');
    add(isNew, 'Нет истории текущей выручки: уточнить источник платежей');
    add(answers.incomeContinues === 'Нет', 'Доход после запуска не сохранится');
    add((answers.repaymentSources || []).includes('forecast'), 'Источник платежей основан только на прогнозе');
    add(answers.equipmentCostUnspecified, 'Стоимость оборудования пока не определена');
    add(answers.ownFundsUnspecified, 'Первоначальный взнос не определён');
    add(answers.ownFunds === '0', 'Нулевой взнос: проверить доступные программы');
    add(answers.supplierChosen === 'Нет', 'Поставщик пока не выбран');
    add(supplierResult.status && supplierResult.status !== 'found', 'Поставщик не проверен по справочнику');
    add(supplierResult.data?.status && supplierResult.data.status !== 'ACTIVE', 'Статус поставщика требует проверки');
    add(supplierResult.data?.mass_address === 'да', 'Поставщик: отметка о массовом адресе');
    add(supplierResult.data?.inn === clientProfile.inn, 'ИНН поставщика совпадает с заявителем');
    add(answers.taxCurrent === 'change', 'Налоговый режим изменён со слов клиента');
    add((answers.receiptCoverage || []).some((x: string) => x !== 'all'), 'Поступления требуют уточнения полноты');
    add(answers.expensesComplete && answers.expensesComplete !== 'yes', 'Расходы требуют уточнения');
    add(answers.debtsComplete && answers.debtsComplete !== 'yes', 'Нужно уточнить обязательства');
    add(clientDebts.some((x) => x.monthly_max_payment_rub && x.source_count && Number(x.source_count) > 1), 'Есть расхождение источников по платежу одного договора');
    add(propertyResult.data?.source_record_status === 'STALE_DEMO', 'Сведения об объекте устарели');
    add(propertyResult.data?.rights_coverage !== 'COMPLETE_DEMO', 'Сведения о правах неполные');
    add(answers.coownerReady && answers.coownerReady !== 'yes', 'Готовность остальных собственников не подтверждена');
    add(answers.equipmentDocumentType === 'later', 'Документ по оборудованию предоставят позже');
    for (const [group, isDeferred] of Object.entries(deferredDocs)) {
      if (isDeferred) {
        const groupLabels: Record<string, string> = {
          equipmentDoc: 'Документ по оборудованию',
          expenseDoc: 'Документы по планируемым расходам',
          otherBankStatements: 'Выписки из других банков',
          egrnDoc: 'Выписка ЕГРН',
          ownershipDoc: 'Документ — основание права',
        };
        out.push(`Документ отложен: ${groupLabels[group] || group}`);
      }
    }

    return [...new Set(out)];
  }, [answers, clientProfile, isPaused, isNew, supplierResult, propertyResult, clientDebts, deferredDocs]);

  // ----------------------------------------------------
  // Сводка для шага "Проверка" (соответствует summaryHtml() из макет.html)
  // ----------------------------------------------------
  const summarySections = useMemo(() => {
    const list: { key: string; short: string; items: { label: string; value: string }[] }[] = [];

    // 1. Данные ИП
    const profileItems: { label: string; value: string }[] = [
      {
        label: 'Сведения актуальны?',
        value: answers.profileCurrent === 'yes' ? 'Да, всё верно' : 'Есть изменения',
      },
    ];
    if (answers.profileCurrent === 'change') {
      if (answers.phone) profileItems.push({ label: 'Новый телефон', value: answers.phone });
      if (answers.email) profileItems.push({ label: 'Новый email', value: answers.email });
      if (answers.profileChanges) profileItems.push({ label: 'Что изменилось?', value: answers.profileChanges });
    }
    profileItems.push({
      label: 'Согласие на обработку персональных данных',
      value: answers.personalDataConsent
        ? `Предоставлено (${answers.personalDataConsentDate ? new Date(answers.personalDataConsentDate).toLocaleDateString('ru-RU') : 'ПЭП'})`
        : 'Не предоставлено',
    });
    list.push({ key: 'profile', short: 'Данные ИП', items: profileItems });

    // 2. Паспорт
    const passportItems: { label: string; value: string }[] = [
      {
        label: 'Паспортные данные актуальны?',
        value: answers.passportCurrent === 'yes' ? 'Да, актуальны' : 'Нет, ввести новые данные',
      },
    ];
    if (answers.passportCurrent === 'change') {
      passportItems.push(
        { label: 'ФИО по паспорту', value: answers.passportName || 'Не указано' },
        { label: 'Серия', value: answers.passportSeries || 'Не указано' },
        { label: 'Номер', value: answers.passportNumber || 'Не указано' },
        { label: 'Дата рождения', value: answers.passportBirth || 'Не указано' },
        { label: 'Дата выдачи', value: answers.passportIssued || 'Не указано' },
        { label: 'Кем выдан', value: answers.passportIssuer || 'Не указано' },
        { label: 'Код подразделения', value: answers.passportCode || 'Не указано' }
      );
    }
    list.push({ key: 'passport', short: 'Паспорт', items: passportItems });

    // 3. Ваш запрос
    const requestItems: { label: string; value: string }[] = [
      {
        label: 'Ваш бизнес уже получает выручку?',
        value:
          answers.business === 'operating'
            ? 'Да, бизнес работает'
            : answers.business === 'new'
            ? 'Ещё нет, готовлюсь к запуску'
            : 'Раньше работал, сейчас приостановлен',
      },
    ];
    if (isPaused) {
      requestItems.push({
        label: 'Опишите ситуацию и нужное финансирование',
        value: answers.pausedDetails || 'Не указано',
      });
    } else {
      requestItems.push(
        {
          label: 'На что нужны деньги?',
          value: isEquipment ? 'Покупка оборудования' : 'Оборотные средства',
        },
        {
          label: 'Какая сумма нужна, ₽',
          value: formatRubles(answers.amount),
        },
        {
          label: 'Желаемый срок, месяцев',
          value: answers.termUnspecified ? 'Помогите подобрать' : `${answers.term} мес.`,
        }
      );
      if (isNew) {
        requestItems.push(
          { label: 'Чем будет заниматься бизнес?', value: answers.activity || 'Не указано' },
          {
            label: 'Когда планируете начать работу?',
            value: answers.launchMonthUnspecified ? 'Пока не определился' : answers.launchMonth || 'Не указано',
          }
        );
      }
    }
    list.push({ key: 'request', short: 'Ваш запрос', items: requestItems });

    if (!isPaused) {
      // 4. Детали
      const detailItems: { label: string; value: string }[] = [];
      if (isEquipment) {
        if (isNew) {
          detailItems.push({
            label: 'Готовы рассмотреть лизинг?',
            value:
              answers.leasing === 'yes'
                ? 'Да'
                : answers.leasing === 'explain'
                ? 'Сначала хочу узнать условия'
                : 'Нет, хочу другой вариант',
          });
        }
        detailItems.push(
          { label: 'Какое оборудование нужно?', value: answers.equipment || 'Не указано' },
          { label: 'Оборудование уже выбрано?', value: answers.equipmentChosen || 'Не указано' },
          {
            label: 'Полная стоимость покупки, ₽',
            value: answers.equipmentCostUnspecified ? 'Стоимость пока неизвестна' : formatRubles(answers.equipmentCost),
          }
        );
        if (answers.costIncludes) {
          detailItems.push({ label: 'Что включено в стоимость?', value: answers.costIncludes });
        }
        detailItems.push(
          {
            label: isNew ? 'Какой первоначальный взнос готовы внести, ₽' : 'Сколько собственных средств вложите, ₽',
            value: answers.ownFundsUnspecified ? 'Пока не определился' : formatRubles(answers.ownFunds),
          },
          { label: 'Поставщик выбран?', value: answers.supplierChosen || 'Не указано' }
        );
        if (answers.supplierChosen === 'Да') {
          detailItems.push({ label: 'ИНН поставщика', value: answers.supplierInn || 'Не указано' });
          if (supplierResult.data?.name || answers.supplierManualName) {
            detailItems.push({
              label: 'Название или ФИО поставщика',
              value: supplierResult.data?.name || answers.supplierManualName,
            });
          }
          if (supplierResult.status === 'found') {
            detailItems.push({ label: 'Это нужный поставщик?', value: answers.supplierConfirmed || 'Да' });
          }
        }
        if (answers.purchaseDate) {
          detailItems.push({ label: 'Когда нужна оплата или поставка?', value: answers.purchaseDate });
          if (answers.pastPurchaseNote) {
            detailItems.push({ label: 'Поясните дату в прошлом', value: answers.pastPurchaseNote });
          }
        }
      } else {
        const expenseTypeMap: Record<string, string> = {
          goods: 'Товары или сырьё',
          running: 'Аренда, зарплата и текущие расходы',
          gap: 'Кассовый разрыв',
          contract: 'Исполнение заказа',
          other: 'Другое',
        };
        detailItems.push(
          { label: 'На какие расходы нужны деньги?', value: expenseTypeMap[answers.expenseType] || answers.expenseType || 'Не указано' },
          { label: 'Кратко опишите расходы', value: answers.expenseDescription || 'Не указано' },
          { label: 'За какой период нужно покрыть расходы?', value: answers.expensePeriod || 'Не указано' }
        );
        if (answers.expenseType === 'running') {
          if (answers.rentAmount) detailItems.push({ label: 'На аренду, ₽', value: formatRubles(answers.rentAmount) });
          if (answers.salaryAmount) detailItems.push({ label: 'На зарплату, ₽', value: formatRubles(answers.salaryAmount) });
          if (answers.utilitiesAmount) detailItems.push({ label: 'На коммунальные услуги, ₽', value: formatRubles(answers.utilitiesAmount) });
          if (answers.otherCostsAmount) detailItems.push({ label: 'На другие текущие расходы, ₽', value: formatRubles(answers.otherCostsAmount) });
          if (answers.costDifference) detailItems.push({ label: 'Поясните разницу с запрашиваемой суммой', value: answers.costDifference });
        }
        if (answers.expenseType === 'gap') {
          if (answers.expectedReceiptDate) detailItems.push({ label: 'Когда ожидаются поступления?', value: answers.expectedReceiptDate });
          if (answers.expectedReceiptSource) detailItems.push({ label: 'За счёт каких поступлений закроется разрыв?', value: answers.expectedReceiptSource });
        }
        detailItems.push(
          { label: 'Есть договор, заказ или счёт по этим расходам?', value: answers.hasContract || 'Не указано' }
        );
        if (answers.paymentDate) {
          detailItems.push({ label: 'Когда нужны деньги?', value: answers.paymentDate });
          if (answers.pastPaymentNote) {
            detailItems.push({ label: 'Поясните дату в прошлом', value: answers.pastPaymentNote });
          }
        }
        if (isNew) {
          detailItems.push({
            label: 'Готовы рассмотреть залог недвижимости?',
            value: answers.collateral === 'yes' ? 'Да' : 'Нет / подходящего объекта нет',
          });
          if (answers.collateral === 'yes') {
            detailItems.push({
              label: 'Как укажете объект?',
              value: answers.propertyInput === 'cadastre' ? 'По кадастровому номеру' : 'Указать адрес, номер уточню позже',
            });
            if (answers.propertyInput === 'cadastre') {
              detailItems.push({ label: 'Кадастровый номер', value: answers.cadastralNumber || 'Не указано' });
            }
            if (answers.propertyAddress || propertyResult.data?.address) {
              detailItems.push({ label: 'Адрес объекта', value: answers.propertyAddress || propertyResult.data?.address || 'Не указано' });
            }
            detailItems.push(
              {
                label: 'Кому принадлежит объект?',
                value: ({ self: 'Мне', other: 'Другому собственнику', shared: 'Общая или долевая собственность' } as Record<string, string>)[answers.propertyOwner] || answers.propertyOwner || 'Не указано',
              },
              {
                label: 'Остальные собственники готовы обсуждать залог?',
                value: ({ yes: 'Да', no: 'Нет', not_discussed: 'Ещё не обсуждали' } as Record<string, string>)[answers.coownerReady] || answers.coownerReady || 'Не указано',
              },
              {
                label: 'Есть ипотека или другие ограничения?',
                value: ({ yes: 'Да', no: 'Нет', clarify: 'Нужно уточнить' } as Record<string, string>)[answers.declaredEncumbrance] || answers.declaredEncumbrance || 'Не указано',
              }
            );
          }
        }
        if (answers.leasing === 'yes' || answers.leasing === 'explain') {
          detailItems.push({
            label: 'Согласие на передачу лизинговому партнёру',
            value: answers.leasingPartnerConsent
              ? `Подтверждено (ООО «Альфа-Лизинг», ${answers.leasingPartnerConsentDate ? new Date(answers.leasingPartnerConsentDate).toLocaleDateString('ru-RU') : 'ПЭП'})`
              : 'Не подтверждено',
          });
        }
      }
      list.push({ key: 'details', short: 'Детали', items: detailItems });

      // 5. Финансы
      const finItems: { label: string; value: string }[] = [];
      if (!isNew) {
        finItems.push({
          label: 'Система налогообложения актуальна?',
          value: answers.taxCurrent === 'yes' ? 'Да' : 'Нет, указать текущую',
        });
        if (answers.taxCurrent === 'change') {
          finItems.push({
            label: 'Текущая система налогообложения',
            value: Array.isArray(answers.taxRegimes) ? answers.taxRegimes.join(', ') : answers.taxRegimes || 'Не указано',
          });
          if (answers.taxOther) finItems.push({ label: 'Укажите другой режим', value: answers.taxOther });
        }
        const coverageMap: Record<string, string> = {
          all: 'Да, все',
          other_banks: 'Есть поступления в других банках',
          cash: 'Есть неучтённая наличная выручка',
          unsure: 'Нужно уточнить',
        };
        finItems.push({
          label: 'Все поступления бизнеса учтены в показанных данных?',
          value: (answers.receiptCoverage || []).map((x: string) => coverageMap[x] || x).join(', ') || 'Да, все',
        });
        if ((answers.receiptCoverage || []).includes('other_banks') && answers.otherBanks) {
          finItems.push({ label: 'В каких ещё банках есть счета бизнеса?', value: answers.otherBanks });
        }
        if ((answers.receiptCoverage || []).includes('cash') && answers.cashAmount) {
          finItems.push({ label: 'Неучтённая наличная выручка в среднем за месяц, ₽', value: formatRubles(answers.cashAmount) });
        }
        finItems.push({
          label: 'Все расходы бизнеса учтены?',
          value: answers.expensesComplete === 'yes' ? 'Да' : answers.expensesComplete === 'no' ? 'Есть дополнительные расходы' : 'Нужно уточнить',
        });
        if (answers.expensesComplete === 'no') {
          if (answers.extraExpenses) finItems.push({ label: 'Дополнительные расходы в месяц, ₽', value: formatRubles(answers.extraExpenses) });
          if (answers.extraExpensesDetails) finItems.push({ label: 'Какие расходы не учтены?', value: answers.extraExpensesDetails });
        }
        finItems.push({
          label: 'Хотите сообщить о дополнительном личном доходе?',
          value: answers.additionalIncome || 'Нет',
        });
        if (answers.additionalIncome === 'Да') {
          if (answers.personalIncome) finItems.push({ label: 'Дополнительный доход после налогов, ₽/мес.', value: formatRubles(answers.personalIncome) });
          if (answers.otherIncomeSource) finItems.push({ label: 'Источник дополнительного дохода', value: answers.otherIncomeSource });
        }
      } else {
        const sourceMap: Record<string, string> = {
          salary: 'Работа по найму',
          business: 'Другой бизнес',
          rent: 'Сдача имущества',
          savings: 'Накопления',
          forecast: 'Только будущая выручка',
          other: 'Другой источник',
        };
        finItems.push(
          {
            label: 'Из каких средств будете платить до устойчивой выручки?',
            value: (answers.repaymentSources || []).map((x: string) => sourceMap[x] || x).join(', ') || 'Не указано',
          },
          { label: 'Совокупный текущий доход после налогов, ₽/мес.', value: formatRubles(answers.personalIncome) },
          { label: 'Этот доход сохранится после запуска?', value: answers.incomeContinues || 'Да' }
        );
        if (answers.committedCosts) {
          finItems.push({ label: 'Неизбежные расходы бизнеса до устойчивой выручки, ₽/мес.', value: formatRubles(answers.committedCosts) });
        }
      }
      finItems.push(
        { label: 'Обязательные личные расходы без кредитов, ₽/мес.', value: formatRubles(answers.personalExpenses) },
        {
          label: 'Список кредитов и лизинга полный и верный?',
          value:
            answers.debtsComplete === 'yes'
              ? 'Да'
              : answers.debtsComplete === 'add'
              ? 'Есть ещё обязательства'
              : answers.debtsComplete === 'change'
              ? 'Нужны исправления'
              : 'Нужно уточнить',
        }
      );
      if (answers.debtsComplete === 'change' && answers.debtChanges) {
        finItems.push({ label: 'Что нужно исправить?', value: answers.debtChanges });
      }
      if (answers.debtsComplete === 'add' && (answers.extraDebts || []).length > 0) {
        finItems.push({
          label: 'Дополнительные обязательства',
          value: answers.extraDebts.map((d: any) => `${d.creditor} · ${d.reference} · ${formatRubles(d.payment)}/мес.`).join('\n'),
        });
      }
      if (!isNew && answers.repaymentDescription) {
        finItems.push({
          label: 'За счёт каких поступлений планируете погашать финансирование?',
          value: answers.repaymentDescription,
        });
      }
      finItems.push({
        label: 'Согласие на запрос в БКИ',
        value: answers.bkiConsent
          ? `Действует ${answers.bkiConsentValidUntil ? `до ${new Date(answers.bkiConsentValidUntil).toLocaleDateString('ru-RU')}` : 'в течение 6 мес.'}`
          : 'Не предоставлено',
      });
      list.push({ key: 'finances', short: 'Финансы', items: finItems });

      // 6. Документы
      const docItems: { label: string; value: string }[] = [];
      if (isEquipment) {
        const docTypeMap: Record<string, string> = {
          invoice: 'Счёт',
          quote: 'Коммерческое предложение',
          contract: 'Договор со спецификацией',
          later: 'Предоставлю позже',
        };
        docItems.push({
          label: 'Что приложите по покупке?',
          value: docTypeMap[answers.equipmentDocumentType] || (deferredDocs.equipmentDoc ? 'Предоставлю позже' : (uploadedFiles.equipmentDoc?.length ? 'Счёт / договор' : 'Не приложен')),
        });
        docItems.push({
          label: 'Документ по оборудованию',
          value: deferredDocs.equipmentDoc ? 'Предоставит позже' : (uploadedFiles.equipmentDoc?.map((f) => f.name).join(', ') || 'Не приложен'),
        });
      } else {
        docItems.push({
          label: 'Документы по планируемым расходам',
          value: deferredDocs.expenseDoc ? 'Предоставит позже' : (uploadedFiles.expenseDoc?.map((f) => f.name).join(', ') || 'Не приложен'),
        });
      }
      if ((answers.receiptCoverage || []).includes('other_banks')) {
        docItems.push({
          label: 'Выписки из других банков',
          value: deferredDocs.otherBankStatements ? 'Предоставит позже' : (uploadedFiles.otherBankStatements?.map((f) => f.name).join(', ') || 'Не приложен'),
        });
      }
      if (isNew && answers.collateral === 'yes') {
        docItems.push(
          {
            label: 'Выписка ЕГРН',
            value: deferredDocs.egrnDoc ? 'Предоставит позже' : (uploadedFiles.egrnDoc?.map((f) => f.name).join(', ') || 'Не приложен'),
          },
          {
            label: 'Документ — основание права',
            value: deferredDocs.ownershipDoc ? 'Предоставит позже' : (uploadedFiles.ownershipDoc?.map((f) => f.name).join(', ') || 'Не приложен'),
          }
        );
      }
      list.push({ key: 'documents', short: 'Документы', items: docItems });

      // 7. Согласия и волеизъявления
      const legalItems: { label: string; value: string }[] = [
        {
          label: '1. Согласие на обработку персональных данных',
          value: answers.personalDataConsent
            ? `Предоставлено (${answers.personalDataConsentDate ? new Date(answers.personalDataConsentDate).toLocaleDateString('ru-RU') : 'ПЭП'})`
            : 'Не предоставлено',
        },
        {
          label: '2. Согласие на запрос в БКИ',
          value: answers.bkiConsent
            ? `Действует ${answers.bkiConsentValidUntil ? `до ${new Date(answers.bkiConsentValidUntil).toLocaleDateString('ru-RU')}` : 'в течение 6 мес.'}`
            : 'Не предоставлено',
        },
      ];
      if (isEquipment && (answers.leasing === 'yes' || answers.leasing === 'explain')) {
        legalItems.push({
          label: '3. Передача лизинговому партнёру',
          value: answers.leasingPartnerConsent
            ? `Подтверждено (ООО «Альфа-Лизинг», ИНН 7707330770)`
            : 'Не подтверждено',
        });
      }
      list.push({ key: 'legal', short: 'Согласия', items: legalItems });
    }

    return list;
  }, [answers, clientProfile, isEquipment, isNew, isPaused, supplierResult, propertyResult, deferredDocs, uploadedFiles]);

  // ----------------------------------------------------
  // Валидация текущего шага
  // ----------------------------------------------------
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep.key === 'profile') {
      if (answers.profileCurrent === 'change' && !answers.profileChanges?.trim()) {
        errs.profileChanges = 'Опишите, какие сведения изменились';
      }
      if (!answers.personalDataConsent) {
        errs.personalDataConsent = 'Для начала оформления анкеты необходимо предоставить согласие на обработку персональных данных';
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
        if ((answers.leasing === 'yes' || answers.leasing === 'explain') && !answers.leasingPartnerConsent) {
          errs.leasingPartnerConsent = 'Для передачи заявки партнёру необходимо подтвердить согласие на передачу сведений ООО «Альфа-Лизинг»';
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
      if (!answers.bkiConsent) {
        errs.bkiConsent = 'Перед запросом кредитной истории необходимо предоставить согласие на запрос в БКИ';
      }
    } else if (currentStep.key === 'review') {
      if (!answers.personalDataConsent) {
        errs.personalDataConsent = 'Не предоставлено согласие на обработку персональных данных';
      }
      if (!answers.bkiConsent) {
        errs.bkiConsent = 'Не предоставлено согласие на запрос в БКИ';
      }
      if (isEquipment && (answers.leasing === 'yes' || answers.leasing === 'explain') && !answers.leasingPartnerConsent) {
        errs.leasingPartnerConsent = 'Не предоставлено согласие на передачу сведений ООО «Альфа-Лизинг»';
      }
      if (!answers.reviewConfirmed) {
        errs.reviewConfirmed = 'Подтвердите проверку сведений';
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ----------------------------------------------------
  // Сборка полезной нагрузки для черновика / заявки
  // ----------------------------------------------------
  const buildDraftPayload = () => {
    return {
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
      neededByDate: answers.paymentDate
        ? (answers.paymentDate.includes('T') ? answers.paymentDate : `${answers.paymentDate}T00:00:00.000Z`)
        : (answers.neededByDate ? new Date(answers.neededByDate).toISOString() : undefined),
      expensePeriod: answers.expensePeriod,
      hasContract: answers.hasContract,
      hasExpenseContract: answers.hasContract === 'Да' ? true : (answers.hasContract === 'Нет' ? false : undefined),
      monthlyRevenue: clientFacts.length
        ? Math.round(clientFacts.reduce((acc, f) => acc + Number(f.clean_receipts_rub), 0) / clientFacts.length)
        : undefined,
      monthlyExpenses: clientFacts.length
        ? Math.round(clientFacts.reduce((acc, f) => acc + Number(f.operating_outflow_rub), 0) / clientFacts.length)
        : undefined,
      householdExpenses: Number(answers.personalExpenses) || 0,
      existingMonthlyObligations: (clientDebts || []).reduce((acc, d) => acc + Number(d.monthly_max_payment_rub || 0), 0) +
        (answers.extraDebts || []).reduce((acc: number, x: any) => acc + Number(x.payment || 0), 0),
      isTaxRegimeActual: answers.taxCurrent === 'yes',
      declaredTaxRegime: answers.taxCurrent === 'change' ? (answers.taxRegimes?.join(',') || answers.taxOther) : clientProfile.tax_regime,
      receiptCoverage: answers.receiptCoverage || [],
      expensesCoverageStatus: answers.expensesComplete,
      hasAdditionalIncome: answers.additionalIncome === 'Да',
      additionalIncomeAmount: answers.additionalIncome === 'Да' ? Number(answers.personalIncome) || 0 : undefined,
      debtsVerificationStatus: answers.debtsComplete,
      repaymentSourceDescription: answers.repaymentDescription,
      personalDataConsent: Boolean(answers.personalDataConsent),
      personalDataConsentDate: answers.personalDataConsentDate || (answers.personalDataConsent ? new Date().toISOString() : undefined),
      bkiConsent: Boolean(answers.bkiConsent),
      bkiConsentDate: answers.bkiConsentDate || (answers.bkiConsent ? new Date().toISOString() : undefined),
      bkiConsentValidUntil: answers.bkiConsentValidUntil,
      leasingPartnerConsent: Boolean(answers.leasingPartnerConsent),
      leasingPartnerName: answers.leasingPartnerName || 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
      leasingPartnerConsentDate: answers.leasingPartnerConsentDate || (answers.leasingPartnerConsent ? new Date().toISOString() : undefined),
      clientAnswers: answers,
      scenario: isNew ? 'new_business' : isPaused ? 'paused' : 'operating',
      submissionPayload: {
        scoringResult: scoringEvaluation,
        riskFlags: riskFindings,
        uploadedFilesSummary: uploadedFiles,
        deferredDocs,
      },
    };
  };

  // ----------------------------------------------------
  // Автоматическое сохранение черновика при переходах между шагами
  // ----------------------------------------------------
  const autoSaveDraft = async () => {
    const targetId = currentDraftId || draftIdParam;
    if (!targetId) return;
    try {
      const payload = buildDraftPayload();
      await clientApi.saveDraft(targetId, payload as any);
      try {
        localStorage.setItem(`draft_answers_${targetId}`, JSON.stringify(answers));
      } catch {}
    } catch (err) {
      console.warn('Автосохранение черновика не удалось:', err);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      autoSaveDraft();
      if (currentStepIdx < wizardSteps.length - 1) {
        setCurrentStepIdx((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      autoSaveDraft();
      setCurrentStepIdx((prev) => prev - 1);
      setValidationErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToStep = (index: number) => {
    autoSaveDraft();
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
  const handleFilesAdded = (group: string, filesList: FileList | File[]) => {
    if (!filesList || !filesList.length) return;

    const newItems: UploadedFileMeta[] = Array.from(filesList).map((f) => ({
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      group,
      url: URL.createObjectURL(f),
      file: f,
    }));

    setUploadedFiles((prev) => ({
      ...prev,
      [group]: [...(prev[group] || []), ...newItems],
    }));

    // Автоматически снимаем флаг "Предоставлю позже", если файл загружен
    setDeferredDocs((prev) => ({
      ...prev,
      [group]: false,
    }));

    // Автоматический ML-анализ выписки по счёту
    const filesArray = Array.from(filesList);
    const statementFile = filesArray.find((f) =>
      f.name.toLowerCase().endsWith('.csv') || f.name.toLowerCase().endsWith('.xlsx')
    );
    const targetDraftId = currentDraftId || draftIdParam || justCreatedDraftIdRef.current;
    if (statementFile && targetDraftId) {
      setIsAnalyzingStatement(true);
      clientApi
        .uploadAndAnalyzeStatement(targetDraftId, statementFile)
        .then((res) => {
          setStatementMlResult({
            ...res,
            fileName: statementFile.name,
          });
          if (res.status === 'ok' && res.metrics) {
            setAnswers((prev) => ({
              ...prev,
              monthlyRevenue: res.metrics!.avgMonthlyRevenueRub,
              monthlyExpenses: res.metrics!.avgMonthlyExpensesRub,
            }));
          }
        })
        .catch((err) => {
          console.warn('ML statement analysis error:', err);
          setStatementMlResult({
            status: 'error',
            message: 'Сервис ML временно недоступен или файл требует уточнения. Показатели можно ввести вручную.',
            fileName: statementFile.name,
          });
        })
        .finally(() => {
          setIsAnalyzingStatement(false);
        });
    }
  };

  const handleFileUpload = (group: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(group, e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (group: string, fileId: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [group]: (prev[group] || []).filter((f) => f.id !== fileId),
    }));
  };

  // ----------------------------------------------------
  // Компонент/рендер карточки загрузки документов
  // ----------------------------------------------------
  const renderUploadCard = (options: {
    group: string;
    title: string;
    subtitle: string;
    badge?: string;
    hintFormats?: string;
    inputId: string;
    allowDefer?: boolean;
    extraHeaderControl?: React.ReactNode;
  }) => {
    const {
      group,
      title,
      subtitle,
      badge,
      hintFormats = 'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT до 25 МБ',
      inputId,
      allowDefer = true,
      extraHeaderControl,
    } = options;

    const isDeferred = deferredDocs[group] || false;
    const files = uploadedFiles[group] || [];
    const isDragging = dragOverGroup === group;

    return (
      <div
        className={`p-6 border rounded-2xl transition-all ${
          isDragging
            ? 'border-[#EF3124] bg-[#fff5f5] ring-2 ring-[#EF3124]/20'
            : 'border-[#e6e8ea] bg-white hover:border-[#cfd3d8]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-base font-bold text-[#141414]">{title}</strong>
              {badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff1ef] text-[#EF3124]">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-[#686b70] mt-1">{subtitle}</p>
          </div>

          <div className="flex items-center gap-4">
            {extraHeaderControl}
            {allowDefer && (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#686b70] hover:text-[#141414] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDeferred}
                  onChange={(e) => setDeferredDocs({ ...deferredDocs, [group]: e.target.checked })}
                  className="rounded text-[#EF3124] focus:ring-[#EF3124]"
                />
                <span>Предоставлю позже</span>
              </label>
            )}
          </div>
        </div>

        {isDeferred ? (
          <div className="p-4 bg-[#f8f9fa] rounded-xl border border-dashed border-[#d8dce0] flex items-center justify-between gap-3 text-xs text-[#686b70]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#00a859] flex-shrink-0" />
              <span>
                Документ отмечен как <b>«Предоставлю позже»</b>. Специалист запросит его при необходимости.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDeferredDocs({ ...deferredDocs, [group]: false })}
              className="text-xs font-bold text-[#EF3124] hover:underline whitespace-nowrap"
            >
              Загрузить сейчас
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id={inputId}
              multiple
              onChange={(e) => handleFileUpload(group, e)}
              className="hidden"
            />
            <label
              htmlFor={inputId}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverGroup(group);
              }}
              onDragLeave={() => setDragOverGroup(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverGroup(null);
                if (e.dataTransfer.files) {
                  handleFilesAdded(group, e.dataTransfer.files);
                }
              }}
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#EF3124] bg-[#ffebeb]'
                  : 'border-[#d0d4d9] hover:border-[#EF3124] bg-[#f8f9fa] hover:bg-[#fff9f9]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#e6e8ea] flex items-center justify-center mb-2 text-[#EF3124]">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#141414] text-center">
                Перетащите файлы сюда или <span className="text-[#EF3124] underline">выберите на диске</span>
              </span>
              <span className="text-[11px] text-[#686b70] mt-1">{hintFormats}</span>
            </label>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-bold text-[#141414] block">
                  Прикрепленные файлы ({files.length}):
                </span>
                <ul className="divide-y divide-[#f0f2f4] border border-[#e6e8ea] rounded-xl overflow-hidden bg-white">
                  {files.map((f) => (
                    <li key={f.id} className="p-3 flex items-center justify-between hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-lg bg-[#fff1ef] text-[#EF3124] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-[#141414] block truncate">
                            {f.name}
                          </span>
                          <span className="text-[11px] text-[#8e9399]">
                            {(f.size / 1024).toFixed(1)} КБ · Готов к отправке
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(group, f.id)}
                        className="p-1.5 text-slate-400 hover:text-[#EF3124] hover:bg-[#fff1ef] rounded-lg transition-colors"
                        title="Удалить файл"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // Отправка заявки в API на проверку (T03)
  // ----------------------------------------------------
  const handleSubmitApplication = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildDraftPayload();

      let targetId = currentDraftId;
      if (!targetId) {
        const created = await clientApi.createDraft(payload as any);
        targetId = created.id;
        setCurrentDraftId(created.id);
      } else {
        await clientApi.saveDraft(targetId, payload as any);
      }
      
      // Отправляем реально загруженные файлы на бэкенд
      const allFilesList = Object.values(uploadedFiles).flat();
      for (const item of allFilesList) {
        if (item.file) {
          try {
            await clientApi.uploadDocument(targetId, item.file);
          } catch (e) {
            console.warn('Backend document upload fallback:', e);
          }
        }
      }

      await clientApi.submitApplication(targetId);
      try {
        localStorage.removeItem(`draft_answers_${targetId}`);
      } catch {}

      setSubmittedAppId(targetId);
    } catch (err: any) {
      console.error('Ошибка отправки заявки:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Ошибка отправки заявки в банк. Проверьте соединение.';
      setSubmitError(msg);
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
              onClick={() => {
                if (onSubmitted) {
                  onSubmitted(submittedAppId);
                } else if (window.location.pathname === `/client/applications/${submittedAppId}`) {
                  window.location.reload();
                } else {
                  navigate(`/client/applications/${submittedAppId}`);
                }
              }}
              className="alfa-btn-secondary"
            >
              Открыть статус заявки
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
    <div className="w-full">
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
        </aside>

        {/* Right Step Content */}
        <main className="wizard-content max-w-[780px] min-w-0">
          <div className="step-heading">
            <div className="eyebrow">
              Шаг {currentStepIdx + 1} из {wizardSteps.length}
            </div>
            <span className="badge">Черновик</span>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(((currentStepIdx + 1) / wizardSteps.length) * 100)}>
            <i style={{ width: `${Math.round(((currentStepIdx + 1) / wizardSteps.length) * 100)}%` }} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#141414] tracking-tight mb-2">
            {currentStep.title}
          </h1>
          {currentStep.subtitle && (
            <p className="text-[#686b70] text-sm mb-6">{currentStep.subtitle}</p>
          )}

          {/* Step 1: Profile */}
          {currentStep.key === 'profile' && (
            <div className="space-y-6">
              {/* Dossier Card */}
              <div className="alfa-panel">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#686b70]">
                    Сведения из реестров и досье банка
                  </h3>
                  {isLoadingDossier && (
                    <span className="text-xs text-[#ef3124] flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#ef3124]" />
                      Загрузка сведений...
                    </span>
                  )}
                </div>

                {dossierFound === false && (
                  <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Данные по ИНН {selectedInn || '—'} не найдены</strong>
                      <p className="text-amber-700 mt-0.5">
                        В базе банка и ЕГРИП нет сохранённого досье. Вы можете продолжить оформление заявки, сведения будут приняты из ответов анкеты.
                      </p>
                    </div>
                  </div>
                )}

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
                    <strong>{clientProfile.okved_main || '—'}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Статус в ЕГРИП</small>
                    <strong>
                      {clientProfile.registry_status === 'ACTIVE'
                        ? 'Действует'
                        : clientProfile.registry_status === 'NOT_FOUND'
                        ? 'Нет данных в реестре'
                        : clientProfile.registry_status}
                    </strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Телефон</small>
                    <strong>{clientProfile.phone || '—'}</strong>
                  </div>
                  <div className="alfa-fact">
                    <small>Email</small>
                    <strong>{clientProfile.email || '—'}</strong>
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

              {/* Согласие на обработку персональных данных */}
              <div className="alfa-panel border border-slate-200 dark:border-slate-800 bg-[#fafbfc] dark:bg-slate-900/60 p-4 rounded-2xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-sm font-bold text-[#141414] dark:text-white">
                      Обработка персональных данных
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('pdn')}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline font-medium flex items-center gap-1 shrink-0"
                  >
                    Подробнее и текст согласия ↗
                  </button>
                </div>

                <p className="text-xs text-[#686b70] dark:text-slate-400 mb-3">
                  Банк проверяет сведения о вас и компании, чтобы рассчитать условия и рассмотреть заявку.
                </p>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(answers.personalDataConsent)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAnswers((prev) => ({
                        ...prev,
                        personalDataConsent: checked,
                        personalDataConsentDate: checked ? new Date().toISOString() : undefined,
                      }));
                      if (checked) {
                        setValidationErrors((errs) => {
                          const next = { ...errs };
                          delete next.personalDataConsent;
                          return next;
                        });
                      }
                    }}
                    className="rounded text-[#EF3124] focus:ring-[#EF3124]"
                  />
                  <span className="text-xs font-semibold text-[#141414] dark:text-slate-200">
                    Согласен на обработку персональных данных
                  </span>
                </label>

                {answers.personalDataConsent && (
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Согласие подтверждено
                  </div>
                )}

                {validationErrors.personalDataConsent && (
                  <p className="text-xs text-[#EF3124] mt-2 font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {validationErrors.personalDataConsent}
                  </p>
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
                        <span>Нет, хочу только банковский кредит</span>
                      </label>
                    </div>

                    {/* Передача данных лизинговому партнёру */}
                    {(answers.leasing === 'yes' || answers.leasing === 'explain') && (
                      <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#fafbfc] dark:bg-slate-900/60">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <h4 className="text-sm font-bold text-[#141414] dark:text-white">
                              Передача данных в ООО «Альфа-Лизинг»
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveConsentType('leasing')}
                            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 underline font-medium flex items-center gap-1 shrink-0"
                          >
                            Подробнее и текст согласия ↗
                          </button>
                        </div>

                        <p className="text-xs text-[#686b70] dark:text-slate-400 mb-3">
                          Передаём параметры оборудования и заявки в Альфа-Лизинг для расчёта графика платежей и подготовки предложения.
                        </p>

                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(answers.leasingPartnerConsent)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAnswers((prev) => ({
                                ...prev,
                                leasingPartnerConsent: checked,
                                leasingPartnerName: 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
                                leasingPartnerConsentDate: checked ? new Date().toISOString() : undefined,
                              }));
                              if (checked) {
                                setValidationErrors((errs) => {
                                  const next = { ...errs };
                                  delete next.leasingPartnerConsent;
                                  return next;
                                });
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-600"
                          />
                          <span className="text-xs font-semibold text-[#141414] dark:text-slate-200">
                            Подтверждаю передачу сведений в ООО «Альфа-Лизинг»
                          </span>
                        </label>

                        {answers.leasingPartnerConsent && (
                          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Передача данных подтверждена
                          </div>
                        )}

                        {validationErrors.leasingPartnerConsent && (
                          <p className="text-xs text-[#EF3124] mt-2 font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            {validationErrors.leasingPartnerConsent}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

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

                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <label className="block text-sm font-bold text-[#141414] mb-1">
                        Когда нужны деньги? <span className="text-xs font-normal text-[#686b70]">(необязательно)</span>
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          type="date"
                          value={answers.purchaseDate || answers.neededByDate || ''}
                          onChange={(e) => setAnswers({ ...answers, purchaseDate: e.target.value, neededByDate: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                        <Calendar className="w-4 h-4 text-[#686b70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
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

                  {/* За какой период нужно покрыть расходы? */}
                  <div>
                    <label className="block text-sm font-bold text-[#141414] mb-1">
                      За какой период нужно покрыть расходы?
                    </label>
                    <input
                      type="text"
                      value={answers.expensePeriod || ''}
                      onChange={(e) => setAnswers({ ...answers, expensePeriod: e.target.value })}
                      placeholder="Например, ноябрь–декабрь 2026 года"
                      className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                    />
                    <span className="text-xs text-[#686b70] block mt-1">
                      Например, ноябрь–декабрь 2026 года.
                    </span>
                  </div>

                  {/* Есть договор, заказ или счёт по этим расходам? */}
                  <div className="pt-2">
                    <label className="text-base font-bold text-[#141414] block mb-2">
                      Есть договор, заказ или счёт по этим расходам?
                    </label>
                    <div className="alfa-choices">
                      <label
                        className={`alfa-choice ${answers.hasContract === 'Да' ? 'selected' : ''}`}
                        onClick={() => setAnswers({ ...answers, hasContract: 'Да' })}
                      >
                        <div className="alfa-radio-dot" />
                        <span>Да</span>
                      </label>
                      <label
                        className={`alfa-choice ${answers.hasContract === 'Нет' ? 'selected' : ''}`}
                        onClick={() => setAnswers({ ...answers, hasContract: 'Нет' })}
                      >
                        <div className="alfa-radio-dot" />
                        <span>Нет</span>
                      </label>
                    </div>
                  </div>

                  {/* Когда нужны деньги? */}
                  <div className="pt-2">
                    <label className="block text-sm font-bold text-[#141414] mb-1">
                      Когда нужны деньги? <span className="text-xs font-normal text-[#686b70]">(необязательно)</span>
                    </label>
                    <div className="relative max-w-xs">
                      <input
                        type="date"
                        value={answers.paymentDate || ''}
                        onChange={(e) => setAnswers({ ...answers, paymentDate: e.target.value, neededByDate: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                      />
                      <Calendar className="w-4 h-4 text-[#686b70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {answers.paymentDate && answers.paymentDate < new Date().toISOString().slice(0, 10) && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-[#141414] mb-1">
                          Поясните дату в прошлом
                        </label>
                        <textarea
                          rows={2}
                          value={answers.pastPaymentNote || ''}
                          onChange={(e) => setAnswers({ ...answers, pastPaymentNote: e.target.value })}
                          placeholder="Уточните, речь о состоявшейся оплате или компенсации расходов"
                          className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                        />
                      </div>
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
                    {/* Плашка и актуальность системы налогообложения */}
                    <div>
                      <div className="p-4 bg-[#f5f6f7] rounded-xl text-xs text-[#141414] mb-3">
                        Система налогообложения в исходной заявке: <b>{clientProfile.tax_regime || 'ОСНО'}</b>. Дата актуальности в источнике не указана.
                      </div>
                      <label className="text-base font-bold text-[#141414] block mb-2">
                        Система налогообложения актуальна?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.taxCurrent === 'yes' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, taxCurrent: 'yes' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.taxCurrent === 'change' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, taxCurrent: 'change' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Нет, указать текущую</span>
                        </label>
                      </div>

                      {answers.taxCurrent === 'change' && (
                        <div className="p-4 bg-[#f5f6f7] rounded-2xl space-y-3 mt-3">
                          <label className="block text-xs font-semibold text-[#141414]">
                            Текущая система налогообложения (при совмещении выберите несколько)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              ['USN_INCOME', 'УСН «Доходы»'],
                              ['USN_EXPENSE', 'УСН «Доходы минус расходы»'],
                              ['OSNO', 'ОСНО (общая)'],
                              ['PATENT', 'ПСН (патент)'],
                              ['AUSN', 'АУСН'],
                              ['NPD', 'НПД (самозанятость)'],
                              ['OTHER', 'Другой режим'],
                            ].map(([code, label]) => {
                              const isSelected = (answers.taxRegimes || []).includes(code);
                              return (
                                <label
                                  key={code}
                                  className={`alfa-choice ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    const cur = answers.taxRegimes || [];
                                    const next = isSelected ? cur.filter((x: string) => x !== code) : [...cur, code];
                                    setAnswers({ ...answers, taxRegimes: next });
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
                          {(answers.taxRegimes || []).includes('OTHER') && (
                            <input
                              type="text"
                              value={answers.taxOther || ''}
                              onChange={(e) => setAnswers({ ...answers, taxOther: e.target.value })}
                              placeholder="Укажите другой режим налогообложения"
                              className="w-full p-2.5 rounded-xl border border-[#e6e8ea] text-sm bg-white"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Все поступления бизнеса учтены в показанных данных? (Чекбоксы) */}
                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <label className="text-base font-bold text-[#141414] block mb-2">
                        Все поступления бизнеса учтены в показанных данных?
                      </label>
                      <div className="alfa-choices">
                        {[
                          ['all', 'Да, все поступления учтены'],
                          ['other_banks', 'Есть поступления в других банках (потребуется выписка)'],
                          ['cash', 'Есть неучтённая наличная выручка'],
                          ['unsure', 'Нужно уточнить'],
                        ].map(([code, label]) => {
                          const isSelected = (answers.receiptCoverage || []).includes(code);
                          return (
                            <label
                              key={code}
                              className={`alfa-choice ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                let cur = answers.receiptCoverage || [];
                                if (code === 'all') {
                                  cur = isSelected ? [] : ['all'];
                                } else {
                                  cur = cur.filter((x: string) => x !== 'all');
                                  cur = isSelected ? cur.filter((x: string) => x !== code) : [...cur, code];
                                }
                                setAnswers({ ...answers, receiptCoverage: cur });
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
                      {(answers.receiptCoverage || []).includes('other_banks') && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-[#141414] mb-1">
                            В каких ещё банках есть счета бизнеса?
                          </label>
                          <input
                            type="text"
                            value={answers.otherBanks || ''}
                            onChange={(e) => setAnswers({ ...answers, otherBanks: e.target.value })}
                            placeholder="Например: Сбербанк, Т-Банк..."
                            className="w-full p-2.5 rounded-xl border border-[#e6e8ea] text-sm"
                          />
                        </div>
                      )}
                      {(answers.receiptCoverage || []).includes('cash') && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-[#141414] mb-1">
                            Неучтённая наличная выручка в среднем за месяц, ₽
                          </label>
                          <input
                            type="number"
                            value={answers.cashAmount || ''}
                            onChange={(e) => setAnswers({ ...answers, cashAmount: e.target.value })}
                            placeholder="50 000"
                            className="w-full max-w-xs p-2.5 rounded-xl border border-[#e6e8ea] text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Все расходы бизнеса учтены? */}
                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <label className="text-base font-bold text-[#141414] block mb-2">
                        Все расходы бизнеса учтены?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.expensesComplete === 'yes' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, expensesComplete: 'yes' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.expensesComplete === 'no' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, expensesComplete: 'no' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Есть дополнительные расходы</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.expensesComplete === 'unsure' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, expensesComplete: 'unsure' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Нужно уточнить</span>
                        </label>
                      </div>
                      {answers.expensesComplete === 'no' && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-[#141414] mb-1">
                            Какие расходы не учтены?
                          </label>
                          <textarea
                            rows={2}
                            value={answers.extraExpensesDetails || ''}
                            onChange={(e) => setAnswers({ ...answers, extraExpensesDetails: e.target.value })}
                            placeholder="Укажите характер неучтённых расходов..."
                            className="w-full p-2.5 rounded-xl border border-[#e6e8ea] text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Хотите сообщить о дополнительном личном доходе? */}
                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <label className="text-base font-bold text-[#141414] block mb-2">
                        Хотите сообщить о дополнительном личном доходе?
                      </label>
                      <div className="alfa-choices">
                        <label
                          className={`alfa-choice ${answers.additionalIncome === 'Да' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, additionalIncome: 'Да' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Да</span>
                        </label>
                        <label
                          className={`alfa-choice ${answers.additionalIncome === 'Нет' ? 'selected' : ''}`}
                          onClick={() => setAnswers({ ...answers, additionalIncome: 'Нет' })}
                        >
                          <div className="alfa-radio-dot" />
                          <span>Нет</span>
                        </label>
                      </div>

                      {answers.additionalIncome === 'Да' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-[#f5f6f7] rounded-2xl">
                          <div>
                            <label className="block text-xs font-semibold text-[#141414] mb-1">
                              Дополнительный доход после налогов, ₽/мес.
                            </label>
                            <input
                              type="number"
                              value={answers.personalIncome || ''}
                              onChange={(e) => setAnswers({ ...answers, personalIncome: e.target.value })}
                              placeholder="50 000"
                              className="w-full p-2.5 rounded-xl border border-[#e6e8ea] text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#141414] mb-1">
                              Источник дополнительного дохода
                            </label>
                            <input
                              type="text"
                              value={answers.otherIncomeSource || ''}
                              onChange={(e) => setAnswers({ ...answers, otherIncomeSource: e.target.value })}
                              placeholder="Сдача недвижимости, дивиденды, подработка..."
                              className="w-full p-2.5 rounded-xl border border-[#e6e8ea] text-sm bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Обязательные личные расходы */}
                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <label className="block text-sm font-bold text-[#141414] mb-1">
                        Обязательные личные расходы без кредитов, ₽/мес.
                      </label>
                      <input
                        type="number"
                        value={answers.personalExpenses || ''}
                        onChange={(e) => setAnswers({ ...answers, personalExpenses: e.target.value })}
                        placeholder="50 000"
                        className="w-full max-w-md p-3 rounded-xl border border-[#e6e8ea] text-sm font-semibold focus:outline-[#EF3124]"
                      />
                      {validationErrors.personalExpenses && (
                        <p className="text-xs text-[#EF3124] mt-1">{validationErrors.personalExpenses}</p>
                      )}
                      <span className="text-xs text-[#686b70] block mt-1">
                        Прожиточный минимум семьи, коммунальные платежи, питание.
                      </span>
                    </div>

                    {/* За счёт каких поступлений планируете погашать финансирование? */}
                    <div className="pt-4 border-t border-[#e6e8ea]">
                      <label className="block text-sm font-bold text-[#141414] mb-1">
                        За счёт каких поступлений планируете погашать финансирование?
                      </label>
                      <textarea
                        rows={3}
                        value={answers.repaymentDescription || ''}
                        onChange={(e) => setAnswers({ ...answers, repaymentDescription: e.target.value })}
                        placeholder="Опишите структуру будущих поступлений, сезонность, стабильность контрактов или договоров..."
                        className="w-full p-3 rounded-xl border border-[#e6e8ea] text-sm focus:outline-[#EF3124]"
                      />
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

              {/* Согласие на запрос кредитной истории */}
              <div className="alfa-panel border border-slate-200 dark:border-slate-800 bg-[#fafbfc] dark:bg-slate-900/60 p-4 rounded-2xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-sm font-bold text-[#141414] dark:text-white">
                      Запрос кредитной истории (БКИ)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('bki')}
                    className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 underline font-medium flex items-center gap-1 shrink-0"
                  >
                    Подробнее и текст согласия ↗
                  </button>
                </div>

                {answers.hasExistingActiveBkiConsent ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Действующее согласие уже есть в банке
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Согласие действительно до {answers.bkiConsentValidUntil ? new Date(answers.bkiConsentValidUntil).toLocaleDateString('ru-RU') : 'конца полугодия'}, повторно подписывать не требуется.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#686b70] dark:text-slate-400 mb-3">
                      Банк запрашивает отчёт в бюро кредитных историй, чтобы оценить долговую нагрузку и предложить одобрение.
                    </p>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(answers.bkiConsent)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
                          setAnswers((prev) => ({
                            ...prev,
                            bkiConsent: checked,
                            bkiConsentDate: checked ? new Date().toISOString() : undefined,
                            bkiConsentValidUntil: checked ? validUntil : undefined,
                          }));
                          if (checked) {
                            setValidationErrors((errs) => {
                              const next = { ...errs };
                              delete next.bkiConsent;
                              return next;
                            });
                          }
                        }}
                        className="rounded text-amber-600 focus:ring-amber-600"
                      />
                      <span className="text-xs font-semibold text-[#141414] dark:text-slate-200">
                        Согласен на запрос кредитной истории
                      </span>
                    </label>

                    {answers.bkiConsent && (
                      <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Согласие подтверждено
                      </div>
                    )}

                    {validationErrors.bkiConsent && (
                      <p className="text-xs text-[#EF3124] mt-2 font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        {validationErrors.bkiConsent}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Documents */}
          {currentStep.key === 'documents' && (
            <div className="space-y-6">
              <div className="alfa-panel">
                <div className="alfa-message">
                  <b>Без лишней бюрократии:</b> Загрузите документы, которые есть у вас прямо сейчас.
                  Любой файл можно предоставить позже — специалист банка запросит недостающее адресно и не заблокирует предварительное рассмотрение заявки.
                </div>

                <div className="space-y-6">
                  {/* 1. По цели кредитования */}
                  {isEquipment ? (
                    renderUploadCard({
                      group: 'equipmentDoc',
                      title: 'Документы по оборудованию и сделке',
                      subtitle: 'Счёт на оплату от поставщика, коммерческое предложение или проект договора со спецификацией',
                      badge: 'Цель заявки',
                      inputId: 'upload-eq',
                    })
                  ) : (
                    renderUploadCard({
                      group: 'expenseDoc',
                      title: 'Документы по расходам и контрактам',
                      subtitle: 'Счета на закупку товаров или сырья, договоры с поставщиками/покупателями, договор аренды или заказ-наряды',
                      badge: 'Цель заявки',
                      inputId: 'upload-expenses',
                    })
                  )}

                  {/* 2. Выписки сторонних банков и финансовая отчетность */}
                  <div>
                    {renderUploadCard({
                      group: 'otherBankStatements',
                      title: 'Выписки по счетам из других банков',
                      subtitle: 'Выписки за последние 6–12 месяцев для подтверждения совокупного оборота бизнеса (1C, PDF, Excel, CSV, TXT)',
                      badge: (answers.receiptCoverage || []).includes('other_banks') ? 'Рекомендуется для скоринга' : undefined,
                      inputId: 'upload-banks',
                      extraHeaderControl: (
                        <a
                          href="/api/client/applications/statement/template"
                          download="statement_template.csv"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fff1ef] hover:bg-[#ffe2de] text-xs font-semibold text-[#EF3124] transition-colors"
                          title="Скачать эталонный CSV-шаблон для ML-анализа"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Шаблон выписки (.CSV)</span>
                        </a>
                      ),
                    })}

                    {/* Индикатор работы ML-анализа */}
                    {isAnalyzingStatement && (
                      <div className="mt-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-800 animate-pulse">
                        <Sparkles className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                        <div>
                          <strong className="block">Нейросеть и ML-модуль анализируют выписку...</strong>
                          <span className="text-[11px] text-blue-600">Распознаются обороты, очищенная выручка и кредитные платежи бизнеса.</span>
                        </div>
                      </div>
                    )}

                    {/* Результат работы ML-анализа */}
                    {statementMlResult && (
                      <div className={`mt-3 p-4 rounded-xl border text-xs ${
                        statementMlResult.status === 'ok'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className={`w-4 h-4 ${statementMlResult.status === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`} />
                            <strong className="text-sm">
                              {statementMlResult.status === 'ok' ? 'ML-анализ выписки завершён успешно' : 'ML-анализ выписки'}
                            </strong>
                          </div>
                          {statementMlResult.fileName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200">
                              {statementMlResult.fileName}
                            </span>
                          )}
                        </div>
                        {statementMlResult.status === 'ok' && statementMlResult.metrics ? (
                          <div>
                            <p className="text-slate-700 mb-2.5">
                              Данные выписки успешно обработаны алгоритмом машинного обучения (ML Pipeline). Рассчитанные показатели автоматически подставлены в параметры заявки:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                                <span className="text-slate-400 block text-[10px]">Подтвержд. выручка</span>
                                <span className="font-extrabold text-emerald-700 text-sm">{formatRubles(statementMlResult.metrics.avgMonthlyRevenueRub)}/мес</span>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                                <span className="text-slate-400 block text-[10px]">Расходы бизнеса</span>
                                <span className="font-extrabold text-slate-800 text-sm">{formatRubles(statementMlResult.metrics.avgMonthlyExpensesRub)}/мес</span>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                                <span className="text-slate-400 block text-[10px]">Кредитные выплаты</span>
                                <span className="font-extrabold text-slate-800 text-sm">{formatRubles(statementMlResult.metrics.avgMonthlyLoanPaymentsRub)}/мес</span>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                                <span className="text-slate-400 block text-[10px]">Глубина истории</span>
                                <span className="font-extrabold text-slate-800 text-sm">{statementMlResult.metrics.monthsCount} мес.</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-700">
                              {statementMlResult.message || 'Требуется ручной ввод показателей выручки и расходов в анкете.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Документы по залогу / недвижимости (если применимо) */}
                  {(answers.collateral === 'yes' || isNew) && (
                    renderUploadCard({
                      group: 'collateralDoc',
                      title: 'Документы по объекту залога и недвижимости',
                      subtitle: 'Выписка из ЕГРН, договор купли-продажи или иное основание права собственности',
                      badge: 'Обеспечение',
                      inputId: 'upload-collateral',
                    })
                  )}

                  {/* 4. Дополнительные документы (всегда доступны) */}
                  {renderUploadCard({
                    group: 'additionalDocs',
                    title: 'Дополнительные документы и пояснения',
                    subtitle: 'Налоговые декларации (УСН/НДС/ОСНО), управленческие отчёты, лицензии, допуски или пояснительная записка',
                    inputId: 'upload-additional',
                    allowDefer: false,
                  })}
                </div>

                {/* Status Summary Banner */}
                <div className="mt-6 p-4 rounded-xl bg-[#f5f6f7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#686b70]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#EF3124]" />
                    <span>
                      Всего загружено документов: <b className="text-[#141414]">{Object.values(uploadedFiles).flat().length}</b>
                      {Object.values(deferredDocs).filter(Boolean).length > 0 && (
                        <span> · Отложено: <b className="text-[#141414]">{Object.values(deferredDocs).filter(Boolean).length}</b></span>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8e9399]">
                    Файлы передаются по защищённому банковскому протоколу
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review (полностью как reviewHtml() в макет.html) */}
          {currentStep.key === 'review' && (
            <div className="alfa-panel">
              {/* Summary Sections */}
              {summarySections.map((sec) => (
                <section key={sec.key} className="summary-section">
                  <div className="summary-head">
                    <h3 className="text-base font-bold text-[#141414]">{sec.short}</h3>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => jumpToStep(wizardSteps.findIndex((s) => s.key === sec.key))}
                    >
                      Изменить
                    </button>
                  </div>
                  <dl className="summary-dl">
                    {sec.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </section>
              ))}

              {/* Specialist findings warning box */}
              {riskFindings.length > 0 && (
                <div className="message warn" style={{ marginTop: '24px' }}>
                  <b>Что уточнит специалист</b>
                  <ul className="mt-2 pl-4 list-disc space-y-1">
                    {riskFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Согласия по заявке */}
              <div className="alfa-panel border border-slate-200 dark:border-slate-800 bg-[#fafbfc] dark:bg-slate-900/60 p-4 rounded-2xl space-y-3" style={{ marginTop: '20px' }}>
                <div>
                  <h4 className="text-sm font-bold text-[#141414] dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Согласия по заявке
                  </h4>
                  <p className="text-xs text-[#686b70] dark:text-slate-400 mt-0.5">
                    Оформляются как три отдельных действия (одна общая галочка их не заменяет):
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  {/* 1. ПДн */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#141414] dark:text-white block">
                        1. Обработка персональных данных
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {answers.personalDataConsent ? '✓ Предоставлено' : 'Не предоставлено'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveConsentType('pdn')}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline font-medium shrink-0"
                    >
                      Текст согласия ↗
                    </button>
                  </div>

                  {/* 2. БКИ */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#141414] dark:text-white block">
                        2. Запрос кредитной истории (БКИ)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {answers.bkiConsent ? '✓ Действует' : 'Не предоставлено'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveConsentType('bki')}
                      className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 underline font-medium shrink-0"
                    >
                      Текст согласия ↗
                    </button>
                  </div>

                  {/* 3. Лизинг */}
                  {isEquipment && (answers.leasing === 'yes' || answers.leasing === 'explain') ? (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-[#141414] dark:text-white block">
                          3. Передача в ООО «Альфа-Лизинг»
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {answers.leasingPartnerConsent ? '✓ Подтверждено' : 'Не подтверждено'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveConsentType('leasing')}
                        className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 underline font-medium shrink-0"
                      >
                        Текст согласия ↗
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-slate-400">
                      <span>3. Передача в Альфа-Лизинг: не требуется (лизинг не выбран)</span>
                      <span>—</span>
                    </div>
                  )}
                </div>

                {validationErrors.personalDataConsent && (
                  <p className="text-xs text-[#EF3124] font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {validationErrors.personalDataConsent}
                  </p>
                )}
                {validationErrors.bkiConsent && (
                  <p className="text-xs text-[#EF3124] font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {validationErrors.bkiConsent}
                  </p>
                )}
                {validationErrors.leasingPartnerConsent && (
                  <p className="text-xs text-[#EF3124] font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    {validationErrors.leasingPartnerConsent}
                  </p>
                )}
              </div>

              {/* Review Confirmation Checkbox */}
              <label className="checkbox-line" style={{ marginTop: '25px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={answers.reviewConfirmed || false}
                  onChange={(e) => {
                    setAnswers((prev) => ({ ...prev, reviewConfirmed: e.target.checked }));
                    if (e.target.checked) {
                      setValidationErrors((errs) => {
                        const next = { ...errs };
                        delete next.reviewConfirmed;
                        return next;
                      });
                    }
                  }}
                  className="rounded text-[#EF3124] focus:ring-[#EF3124]"
                />
                <span className="text-sm font-semibold text-[#141414]">
                  Проверил сведения. Понимаю, что ошибки и неполные данные могут повлиять на рассмотрение и условия финансирования.
                </span>
              </label>

              {validationErrors.reviewConfirmed && (
                <p className="error-text">{validationErrors.reviewConfirmed}</p>
              )}

              <p className="hint">
                В прототипе обращение появится в режиме банка на этом устройстве. Передачи реальному банку нет.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {submitError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-sm flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#EF3124] shrink-0" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          {/* Bottom Action Navigation Buttons */}
          <div className="nav-buttons">
            {currentStepIdx > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="secondary"
              >
                ← Назад
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
                  className="primary"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Отправка...' : 'Передать на рассмотрение →'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="primary"
                >
                  Продолжить →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Модальное окно просмотра и подтверждения согласий */}
      <ConsentModal
        isOpen={activeConsentType !== null}
        onClose={() => setActiveConsentType(null)}
        type={activeConsentType || 'pdn'}
        onAccept={() => handleAcceptConsent(activeConsentType)}
        isAccepted={
          activeConsentType === 'pdn'
            ? Boolean(answers.personalDataConsent)
            : activeConsentType === 'bki'
            ? Boolean(answers.bkiConsent)
            : activeConsentType === 'leasing'
            ? Boolean(answers.leasingPartnerConsent)
            : false
        }
        partnerName={answers.leasingPartnerName || 'ООО «Альфа-Лизинг» (ИНН 7707330770)'}
        applicantName={clientProfile.full_name || 'Индивидуальный предприниматель'}
        inn={clientProfile.inn || selectedInn || 'не указан'}
      />
    </div>
  );
};
