import { CreditApplication, ClientRequestItem, UploadedDocument } from '../types/application';
import { ALFA_DATA } from '../data/alfaDemoData';
import { DEMO_COVERAGE, DEMO_RIGHTS } from '../data/demoCoverageRights';
import { evaluate, ScoringInput } from './scoreEngine';

const STORAGE_KEY = 'alfa_smart_kabinet_apps_v2';

function uid(prefix = 'REQ'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

function stamp(): string {
  return new Date().toISOString();
}

export function scenarioLabel(answers: Record<string, any> = {}): string {
  const isOperating = answers.business === 'operating' || answers.stage === 'operating';
  const isEquipment = answers.purpose === 'equipment';
  if (isOperating) {
    return isEquipment ? 'Покупка оборудования · Действующий бизнес' : 'Пополнение оборотных средств · Действующий бизнес';
  }
  return isEquipment ? 'Покупка оборудования · Новый бизнес' : 'Запуск нового направления · Индивидуально';
}

function initialApplications(): CreditApplication[] {
  return ALFA_DATA.applications.map((demo) => {
    const isEquipment = demo.purpose === 'equipment' || demo.product_code === 'EQ';
    const amount = Number(demo.amount_rub || (isEquipment ? 2500000 : 1000000));
    const term = Number(demo.requested_term_months || (isEquipment ? 36 : 12));

    const app: CreditApplication = {
      id: demo.application_id,
      inn: demo.inn,
      clientName: demo.full_name,
      companyName: `ИП ${demo.full_name}`,
      stage: demo.stage === 'new' ? 'prelaunch' : 'operating',
      businessType: demo.stage === 'new' ? 'prelaunch' : 'operating',
      purpose: isEquipment ? 'Оборудование' : 'Оборотные средства',
      purposeCode: isEquipment ? 'equipment' : 'working_capital',
      productCode: (demo.product_code as any) || (isEquipment ? 'EQ' : 'WC'),
      requestedAmount: amount,
      requestedTermMonths: term,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      status: (demo.application_id === 'DEMO-001' ? 'in_review' :
               demo.application_id === 'DEMO-002' ? 'waiting_check' :
               demo.application_id === 'DEMO-003' ? 'need_info' :
               demo.application_id === 'DEMO-004' ? 'review' :
               demo.application_id === 'DEMO-005' ? 'offer' :
               demo.application_id === 'DEMO-006' ? 'declined' : 'in_review') as any,
      createdAt: demo.registration_date ? `${demo.registration_date}T10:00:00Z` : stamp(),
      updatedAt: stamp(),
      documents: isEquipment ? [
        {
          id: `DOC-${demo.application_id}-1`,
          fileName: 'Спецификация_и_счёт_на_оборудование.pdf',
          fileSizeBytes: 245000,
          fileType: 'contract',
          uploadedAt: `${demo.registration_date || '2026-10-20'}T12:00:00Z`,
          status: 'verified',
          review: 'verified',
          reviewedAt: `${demo.registration_date || '2026-10-20'}T14:30:00Z`,
          reviewNote: 'Счёт проверен, реквизиты поставщика совпадают с ЕГРЮЛ',
          group: 'equipmentDoc',
        }
      ] : [
        {
          id: `DOC-${demo.application_id}-2`,
          fileName: 'Банковская_выписка_за_12_мес.pdf',
          fileSizeBytes: 1240000,
          fileType: 'bank_statement',
          uploadedAt: `${demo.registration_date || '2026-10-20'}T11:00:00Z`,
          status: 'verified',
          review: 'verified',
          reviewedAt: `${demo.registration_date || '2026-10-20'}T13:00:00Z`,
          reviewNote: 'Обороты подтверждены',
          group: 'otherBankStatements',
        }
      ],
      history: [
        {
          id: uid('TR'),
          transitionCode: 'T01',
          fromStatus: 'draft',
          toStatus: 'draft',
          actor: 'client',
          actorName: demo.full_name,
          timestamp: demo.registration_date ? `${demo.registration_date}T10:00:00Z` : stamp(),
          comment: 'Создано обращение на получение кредита для бизнеса',
        },
        {
          id: uid('TR'),
          transitionCode: 'T03',
          fromStatus: 'draft',
          toStatus: 'checking',
          actor: 'client',
          actorName: demo.full_name,
          timestamp: demo.registration_date ? `${demo.registration_date}T10:30:00Z` : stamp(),
          comment: 'Заявка отправлена на скоринг и проверку банком',
        },
        {
          id: uid('TR'),
          transitionCode: 'T07',
          fromStatus: 'checking',
          toStatus: 'review',
          actor: 'system',
          actorName: 'Система скоринга',
          timestamp: demo.registration_date ? `${demo.registration_date}T10:35:00Z` : stamp(),
          comment: 'Расчёт завершён. Передано специалисту на ручную верификацию',
        }
      ],
      events: [
        {
          at: demo.registration_date ? `${demo.registration_date}T10:30:00Z` : stamp(),
          actor: 'Клиент',
          public: true,
          text: `Подана заявка на сумму ${amount.toLocaleString('ru-RU')} ₽ сроком ${term} мес.`
        },
        {
          at: demo.registration_date ? `${demo.registration_date}T10:35:00Z` : stamp(),
          actor: 'Система',
          public: true,
          text: 'Автоматическая проверка данных по реестрам ФНС и БКИ выполнена'
        }
      ],
      requests: demo.application_id === 'DEMO-003' ? [
        {
          id: 'REQ-DEMO-001',
          title: 'Уточнение сведений о контракте и подтверждение выручки',
          reason: 'В выписке за последний месяц отмечено снижение операционных поступлений на 25%.',
          documentType: 'Акт сверки или доп. выписка',
          period: '01.08.2026–30.09.2026',
          documentPurpose: 'otherBankStatements',
          status: 'open',
          createdAt: '2026-10-21T09:15:00Z',
        }
      ] : demo.application_id === 'DEMO-002' ? [
        {
          id: 'REQ-DEMO-002',
          title: 'Подтверждение собственного взноса по оборудованию',
          reason: 'Сумма аванса по счёту составляет 287 000 ₽. Требуется подтвердить наличие остатка.',
          documentType: 'Справка об остатке на счёте',
          period: 'на текущую дату',
          documentPurpose: 'equipmentDoc',
          status: 'responded',
          createdAt: '2026-10-22T10:00:00Z',
          respondedAt: '2026-10-22T15:20:00Z',
          response: 'Выписка с депозитного счёта с остатком 430 000 ₽ прикреплена.',
        }
      ] : [],
      checks: {
        identity: 'verified',
        finances: demo.application_id === 'DEMO-005' ? 'verified' : 'pending',
        supplier: isEquipment ? (demo.supplier_inn ? 'verified' : 'pending') : undefined,
        property: undefined,
      },
      scoringOverrides: {
        debtPayment: null,
        extraExpenses: null,
        debtReconciled: false,
        extraExpensesConfirmed: false,
        ownFundsConfirmed: false,
        taxConfirmed: false,
        note: '',
      },
      clientAnswers: {
        business: demo.stage || 'operating',
        purpose: demo.purpose || 'working_capital',
        amount: amount,
        term: term,
        equipmentCost: demo.equipment_price_rub || null,
        ownFunds: demo.own_contribution_rub || null,
        supplierInn: demo.supplier_inn || '',
        supplierConfirmed: demo.supplier_inn ? 'Да' : 'Нет',
        supplierResult: demo.supplier_inn ? {
          inn: demo.supplier_inn,
          name: 'ООО «ТехноПромПоставка»',
          status: 'found',
          registryStatus: 'ACTIVE',
          related: false,
          massAddress: 'нет',
        } : null,
        personalExpenses: Number(demo.householdExpenses_monthly_rub || 50000),
        receiptCoverage: ['all'],
        expensesComplete: 'yes',
        debtsComplete: 'yes',
        taxCurrent: 'same',
        passportCurrent: 'same',
      }
    };

    return app;
  });
}

class ApplicationStore {
  private apps: CreditApplication[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.apps = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored applications, using synthetic seeds', e);
    }
    this.apps = initialApplications();
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.apps));
    } catch (e) {
      console.error('Failed to persist applications to localStorage', e);
    }
  }

  public getAll(): CreditApplication[] {
    return [...this.apps];
  }

  public getById(id: string): CreditApplication | null {
    const found = this.apps.find((a) => a.id === id);
    return found ? { ...found } : null;
  }

  public saveApp(app: CreditApplication): void {
    const idx = this.apps.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      this.apps[idx] = { ...app, updatedAt: stamp() };
    } else {
      this.apps.unshift({ ...app, updatedAt: stamp() });
    }
    this.save();
  }

  public addEvent(appId: string, text: string, isPublic = true, actor = 'Специалист'): void {
    const app = this.getById(appId);
    if (!app) return;
    app.events = app.events || [];
    app.events.push({
      at: stamp(),
      actor,
      public: isPublic,
      text,
    });
    this.saveApp(app);
  }

  public addClientRequest(
    appId: string,
    req: {
      title: string;
      reason: string;
      documentType?: string;
      period?: string;
      documentPurpose?: string;
    }
  ): ClientRequestItem {
    const app = this.getById(appId);
    if (!app) throw new Error('Заявка не найдена');

    const newReq: ClientRequestItem = {
      id: uid('REQ'),
      title: req.title,
      reason: req.reason,
      documentType: req.documentType || '',
      period: req.period || '',
      documentPurpose: req.documentPurpose || 'general',
      status: 'open',
      createdAt: stamp(),
    };

    app.requests = app.requests || [];
    app.requests.push(newReq);
    app.status = 'need_info'; // awaiting_info
    app.needInfoPrompt = `${newReq.title}${newReq.reason ? ` — ${newReq.reason}` : ''}`;

    this.addEvent(app.id, `Запрос клиенту: ${newReq.title}`, true, 'Специалист');

    app.history = app.history || [];
    app.history.push({
      id: uid('TR'),
      transitionCode: 'T11',
      fromStatus: 'review',
      toStatus: 'need_info',
      actor: 'analyst',
      actorName: 'Кредитный аналитик',
      comment: `Запрос сведений: ${newReq.title}. ${newReq.reason}`,
      timestamp: stamp(),
    });

    this.saveApp(app);
    return newReq;
  }

  public replyClientRequest(
    appId: string,
    requestId: string,
    response: string,
    files?: UploadedDocument[]
  ): void {
    const app = this.getById(appId);
    if (!app) return;

    app.requests = app.requests || [];
    const r = app.requests.find((x) => x.id === requestId);
    if (r) {
      r.status = 'responded';
      r.response = response;
      r.respondedAt = stamp();
      if (files && files.length > 0) {
        r.files = [...(r.files || []), ...files];
        app.documents = [...(app.documents || []), ...files];
      }
    }

    app.needInfoResponse = response;
    this.addEvent(app.id, `Ответ клиента на запрос: ${r?.title || requestId}`, true, 'Клиент');

    app.history = app.history || [];
    app.history.push({
      id: uid('TR'),
      transitionCode: 'T10',
      fromStatus: 'need_info',
      toStatus: 'checking',
      actor: 'client',
      actorName: app.clientName || 'Клиент',
      comment: `Ответ клиента: ${response}`,
      timestamp: stamp(),
    });

    this.saveApp(app);
  }

  public closeClientRequest(appId: string, requestId: string): void {
    const app = this.getById(appId);
    if (!app) return;

    app.requests = app.requests || [];
    const r = app.requests.find((x) => x.id === requestId);
    if (r) {
      r.status = 'closed';
    }

    this.addEvent(app.id, `Уточнение принято: ${r?.title || requestId}`, true, 'Специалист');

    if (!app.requests.some((x) => x.status !== 'closed')) {
      app.status = 'review';
    }

    this.saveApp(app);
  }

  public updateCheck(appId: string, checkKey: string, value: 'pending' | 'verified' | 'issue'): void {
    const app = this.getById(appId);
    if (!app) return;
    app.checks = app.checks || {};
    app.checks[checkKey] = value;
    this.addEvent(app.id, `Ручная проверка ${checkKey}: ${value === 'verified' ? 'Проверено' : value === 'issue' ? 'Есть вопрос' : 'Не завершена'}`, false, 'Специалист');
    this.saveApp(app);
  }

  public setStatus(
    appId: string,
    nextStatus: string,
    reason: string,
    manualOffer?: any
  ): void {
    const app = this.getById(appId);
    if (!app) return;

    app.status = nextStatus as any;
    if (nextStatus === 'approved' || nextStatus === 'offer') {
      app.manualOffer = manualOffer;
      app.offer = {
        approvedAmount: Number(manualOffer?.amount || app.requestedAmount),
        approvedTermMonths: Number(manualOffer?.term || app.requestedTermMonths),
        annualInterestRate: Number(manualOffer?.rate || 18.5),
        monthlyPayment: Number(manualOffer?.payment || 0),
        totalRepayment: Number(manualOffer?.payment || 0) * Number(manualOffer?.term || 12),
        expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      this.addEvent(app.id, `Одобрено предложение: ${manualOffer?.amount} ₽, ${manualOffer?.term} мес. под ${manualOffer?.rate}%`, true, 'Специалист');
    } else if (nextStatus === 'declined') {
      app.declineReason = reason;
      this.addEvent(app.id, `Отказ по заявке: ${reason}`, true, 'Специалист');
    } else {
      this.addEvent(app.id, `Статус изменён на "${nextStatus}": ${reason}`, true, 'Специалист');
    }

    this.saveApp(app);
  }

  public verifyFile(appId: string, fileId: string, note?: string, replacedId?: string): void {
    const app = this.getById(appId);
    if (!app) return;
    const all = [
      ...(app.documents || []),
      ...Object.values(app.files || {}).flat()
    ];
    const f = all.find((doc) => doc.id === fileId);
    if (f) {
      f.review = 'verified';
      f.status = 'verified';
      f.reviewedAt = stamp();
      f.reviewNote = note || 'Проверено специалистом';

      if (replacedId) {
        const replaced = all.find((doc) => doc.id === replacedId && doc.review === 'rejected');
        if (replaced) {
          replaced.review = 'superseded';
          (replaced as any).supersededBy = fileId;
          (f as any).replacesFileId = replaced.id;
          (f as any).replacementForGroup = replaced.group;
        }
      }

      this.addEvent(app.id, `Проверен файл «${f.fileName || (f as any).name || 'Документ'}»: ${note || 'Проверено'}`, false, 'Специалист');
      this.saveApp(app);
    }
  }

  public rejectFile(appId: string, fileId: string, note?: string): void {
    const app = this.getById(appId);
    if (!app) return;
    const all = [
      ...(app.documents || []),
      ...Object.values(app.files || {}).flat()
    ];
    const f = all.find((doc) => doc.id === fileId);
    if (f) {
      f.review = 'rejected';
      f.status = 'rejected';
      f.reviewedAt = stamp();
      f.reviewNote = note || 'Требуется замена документа';
      this.addEvent(app.id, `Нужна замена файла «${f.fileName || (f as any).name || 'Документ'}»: ${note || 'Требуется замена'}`, false, 'Специалист');
      this.saveApp(app);
    }
  }

  public saveAnalysis(appId: string, analysis: any, fingerprint: string, inputSnapshot: any): void {
    const app = this.getById(appId);
    if (!app) return;
    if (app.analysis) {
      app.analysisHistory = app.analysisHistory || [];
      app.analysisHistory.push(app.analysis);
    }
    app.analysis = {
      ...analysis,
      calculatedAt: stamp(),
      inputFingerprint: fingerprint,
      inputSnapshot,
    };
    app.offerReviewFingerprint = null;
    this.addEvent(
      app.id,
      `Сохранён скоринг по правилам ${analysis.rulesVersion || 'Excel'}: ${analysis.recommendation}; балл ${analysis.score ?? 'не применяется'}.`,
      false,
      'Специалист'
    );
    this.saveApp(app);
  }

  public saveScoringEvidence(appId: string, overrides: any): void {
    const app = this.getById(appId);
    if (!app) return;
    if (app.analysis) {
      app.analysisHistory = app.analysisHistory || [];
      app.analysisHistory.push({
        ...app.analysis,
        stale: true,
        invalidatedAt: stamp(),
        invalidationReason: 'Сотрудник уточнил финансовые сведения',
      });
      app.analysis = null;
    }
    app.scoringOverrides = {
      ...overrides,
      at: stamp(),
      actor: 'Специалист',
    };
    app.checks = app.checks || {};
    app.checks.finances = 'pending';
    app.offerReviewFingerprint = null;
    this.addEvent(app.id, `Сохранена ручная сверка входов скоринга. ${overrides.note || ''}`, false, 'Специалист');
    this.saveApp(app);
  }

  public addInternalNote(appId: string, note: string): void {
    const app = this.getById(appId);
    if (!app || !note.trim()) return;
    this.addEvent(app.id, note.trim(), false, 'Специалист');
  }
}

export const applicationStore = new ApplicationStore();
