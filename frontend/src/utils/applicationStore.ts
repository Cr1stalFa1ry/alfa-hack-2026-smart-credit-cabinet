import { CreditApplication, ClientRequestItem, UploadedDocument } from '../types/application';
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

function isDemoApp(appId?: string): boolean {
  if (!appId) return false;
  return appId.startsWith('DEMO-') || appId.includes('DEMO');
}

function initialApplications(): CreditApplication[] {
  return [];
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
        if (Array.isArray(parsed)) {
          this.apps = parsed.filter((a: any) => !isDemoApp(a?.id));
          this.save();
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored applications', e);
    }
    this.apps = [];
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
    return this.apps.filter((a) => !isDemoApp(a.id));
  }

  public getById(id: string): CreditApplication | null {
    if (isDemoApp(id)) return null;
    const found = this.apps.find((a) => a.id === id);
    return found ? { ...found } : null;
  }

  public saveApp(app: CreditApplication): void {
    if (isDemoApp(app.id)) return;
    const idx = this.apps.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      this.apps[idx] = { ...app, updatedAt: stamp() };
    } else {
      this.apps.unshift({ ...app, updatedAt: stamp() });
    }
    this.save();
  }

  public syncApps(freshApps: CreditApplication[]): void {
    this.apps = freshApps.filter((a) => !isDemoApp(a.id));
    this.save();
  }

  public removeApp(id: string): void {
    this.apps = this.apps.filter((a) => a.id !== id);
    this.save();
  }

  public clearAll(): void {
    this.apps = [];
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

    const nowIso = stamp();
    const newReq: ClientRequestItem = {
      id: uid('REQ'),
      title: req.title,
      reason: req.reason,
      documentType: req.documentType || '',
      period: req.period || '',
      documentPurpose: req.documentPurpose || 'general',
      status: 'open',
      createdAt: nowIso,
    };

    app.requests = app.requests || [];
    app.requests.push(newReq);
    app.status = 'need_info'; // awaiting_info
    const promptText = req.reason && req.reason.trim() !== req.title.trim()
      ? `${req.title}. ${req.reason}`
      : req.title;
    app.needInfoPrompt = promptText;
    // Сбрасываем ответ и файлы от предыдущего дозапроса
    app.needInfoResponse = undefined;
    app.needInfoFiles = undefined;

    this.addEvent(app.id, `Запрос клиенту: ${newReq.title}`, true, 'Специалист');

    app.history = app.history || [];
    app.history.push({
      id: uid('TR'),
      transitionCode: 'T11',
      fromStatus: 'review',
      toStatus: 'need_info',
      actor: 'analyst',
      actorName: 'Кредитный аналитик',
      comment: `Запрос сведений: ${promptText}`,
      timestamp: nowIso,
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
      r.files = files && files.length > 0 ? [...files] : [];
      if (files && files.length > 0) {
        const existingDocIds = new Set((app.documents || []).map((d) => d.id));
        const newDocs = files.filter((f) => !existingDocIds.has(f.id));
        app.documents = [...(app.documents || []), ...newDocs];
      }
    }

    app.needInfoResponse = response;
    app.needInfoFiles = files && files.length > 0 ? [...files] : undefined;
    this.addEvent(app.id, `Ответ клиента на запрос: ${r?.title || requestId}`, true, 'Клиент');

    const fileSuffix = files && files.length > 0
      ? ` (Прикреплено файлов: ${files.map((f) => f.fileName).join(', ')})`
      : '';

    app.history = app.history || [];
    app.history.push({
      id: uid('TR'),
      transitionCode: 'T10',
      fromStatus: 'need_info',
      toStatus: 'checking',
      actor: 'client',
      actorName: app.clientName || 'Клиент',
      comment: `Ответ клиента: ${response}${fileSuffix}`,
      timestamp: stamp(),
      files: files && files.length > 0 ? [...files] : [],
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
