import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditApplication, BusinessType } from '../../types/application';
import { clientApi } from '../../api/clientApi';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { ProductCodeBadge } from '../../components/badges/ProductCodeBadge';
import { StateMachineStepper } from '../../components/application/StateMachineStepper';
import { ScoringCard } from '../../components/application/ScoringCard';
import { OfferCard } from '../../components/application/OfferCard';
import { NeedInfoResponseModal } from '../../components/application/NeedInfoResponseModal';
import { FileUpload } from '../../components/common/FileUpload';
import { ConsentModal, ConsentType } from '../../components/application/ConsentModal';
import { NewApplicationWizardPage } from './NewApplicationWizardPage';
import { formatRubles, formatDateTime, formatInn } from '../../utils/formatters';
import { STATUS_MAP, TRANSITION_DESCRIPTIONS } from '../../utils/statusHelpers';
import {
  ArrowLeft,
  History,
  RotateCcw,
  Send,
  MessageSquare,
  XCircle,
  FileText,
  Building2,
  ShieldCheck,
  Check,
  User,
  Cpu,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Modals
  const [isNeedInfoModalOpen, setIsNeedInfoModalOpen] = useState(false);
  const [activeConsentType, setActiveConsentType] = useState<ConsentType | null>(null);

  const getActorBadge = (actor: string, name?: string) => {
    switch (actor) {
      case 'client':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
            <User className="w-3 h-3" /> {name || 'Клиент ИП'}
          </span>
        );
      case 'analyst':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
            <ShieldAlert className="w-3 h-3" /> {name || 'Аналитик'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <Cpu className="w-3 h-3" /> {name || 'SmartKabinet Engine'}
          </span>
        );
    }
  };

  useEffect(() => {
    if (id) {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (appId: string) => {
    setIsLoading(true);
    try {
      const data = await clientApi.getApplicationById(appId);
      // Safe normalization of all nested properties
      const normalized: CreditApplication = {
        ...data,
        companyName: data.companyName || `ИП (ИНН ${data.inn || ''})`,
        documents: data.documents || [],
        history: data.history || [],
      };
      setApplication(normalized);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // T06: Retry check from waiting_check
  const handleRetryCheck = async () => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const updated = await clientApi.retryCheck(application.id);
      setApplication((prev) => (prev ? { ...prev, ...updated, status: 'checking' } : null));
    } finally {
      setIsActionLoading(false);
    }
  };

  // T10: Reply to need_info
  const handleReplyNeedInfo = async (responseText: string) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const updated = await clientApi.replyNeedInfo(application.id, responseText);
      setApplication((prev) => (prev ? { ...prev, ...updated, status: 'checking' } : null));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Accept offer
  const handleAcceptOffer = async (useAlternative: boolean) => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const updated = await clientApi.acceptOffer(application.id, useAlternative);
      setApplication((prev) => (prev ? { ...prev, ...updated } : null));
    } finally {
      setIsActionLoading(false);
    }
  };

  // T17: Withdraw application
  const handleWithdraw = async () => {
    if (!application) return;
    if (window.confirm('Вы действительно хотите отозвать эту кредитную заявку?')) {
      setIsActionLoading(true);
      try {
        const updated = await clientApi.withdrawApplication(application.id);
        setApplication((prev) => (prev ? { ...prev, ...updated, status: 'closed' } : null));
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!application) return;
    const doc = await clientApi.uploadDocument(application.id, file);
    setApplication((prev) => (prev ? { ...prev, documents: [...(prev.documents || []), doc] } : null));
    return doc;
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!application) return;
    await clientApi.deleteDocument(application.id, docId);
    setApplication((prev) =>
      prev
        ? {
            ...prev,
            documents: (prev.documents || []).filter((d) => d.id !== docId),
          }
        : null
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500">
        Загрузка данных кредитной заявки...
      </div>
    );
  }

  if (!application) {
    return (
      <Card className="text-center py-12 space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Заявка не найдена
        </h3>
        <Button variant="primary" size="sm" onClick={() => navigate('/client/dashboard')}>
          Вернуться к списку заявок
        </Button>
      </Card>
    );
  }

  // Если это анкета-черновик — предоставляем форму заполнения анкеты (как на /client/new)
  const isDraft =
    (application.status as any) === 'draft' ||
    String(application.status).toLowerCase() === 'draft' ||
    String(application.status) === '0';

  if (isDraft) {
    return (
      <NewApplicationWizardPage
        draftId={application.id}
        initialApplication={application}
        onSubmitted={async (submittedId) => {
          await loadApplication(submittedId);
        }}
      />
    );
  }

  const documents = application.documents || [];
  const history = application.history || [];
  const companyTitle = application.companyName || `ИП (ИНН ${application.inn})`;

  // Оставляем только реальные изменения статуса и событие создания (T01), исключая промежуточные автосохранения (T02)
  const statusHistory = history.filter((record) => {
    const isAutosave =
      record.transitionCode === 'T02' ||
      (record.fromStatus === 'draft' &&
        record.toStatus === 'draft' &&
        (record.comment?.includes('T02') || record.comment?.includes('Сохранены изменения')));
    return !isAutosave;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Заявка № {application.id}
              </h1>
              {application.productCode && <ProductCodeBadge code={application.productCode} size="sm" />}
              {application.status !== 'checking' && (
                <ApplicationStatusBadge status={application.status} />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Создана: {formatDateTime(application.createdAt)} • {companyTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['draft', 'checking', 'waiting_check', 'need_info', 'review', 'offer'].includes(application.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWithdraw}
              isLoading={isActionLoading}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Отозвать заявку (T17)
            </Button>
          )}
        </div>
      </div>

      {/* Application Stepper */}
      <StateMachineStepper status={application.status} />

      {/* Saved Notification */}
      {isSavedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" /> Изменения в черновике сохранены (T02)
        </div>
      )}

      {/* Special State Banners */}
      {/* T05 Waiting Check (503 Service Unavailable) */}
      {application.status === 'waiting_check' && (
        <Alert
          type="warning"
          title="Внешний сервис временно недоступен (503 SOURCE_UNAVAILABLE)"
          action={
            <Button
              size="sm"
              variant="primary"
              onClick={handleRetryCheck}
              isLoading={isActionLoading}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Повторить проверку сейчас (T06)
            </Button>
          }
        >
          Один из государственных реестров (ФНС / БКИ) вернул временную ошибку. Заявка не отклонена.
          Вы можете запустить повторную проверку вручную или система повторит её по расписанию.
        </Alert>
      )}

      {/* T04 / T11 Need Info Active Inquiry */}
      {application.status === 'need_info' && (
        <div className="p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80 dark:border-amber-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Запрос сведений от банка</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                    T11 • Требуется ответ
                  </span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {application.needInfoActorName || 'Кредитный аналитик банка'} • {application.needInfoRequestedAt ? formatDateTime(application.needInfoRequestedAt) : 'Ожидает ваших разъяснений'}
                </span>
              </div>
            </div>

            <Button
              size="md"
              variant="primary"
              onClick={() => setIsNeedInfoModalOpen(true)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Предоставить сведения (T10)
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-amber-200 dark:border-amber-800 shadow-inner">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">
              Вопрос специалиста:
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
              {application.needInfoPrompt || 'Пожалуйста, прикрепите подтверждающие документы или уточните финансовые показатели.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
            <span>
              💡 Прикрепите выписку, договор или укажите пояснения в свободной форме. После отправки заявка вернётся на повторную проверку.
            </span>
            <span className="font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
              Переход FSM: need_info → checking (T10)
            </span>
          </div>
        </div>
      )}

      {/* Communication history if inquiry has been responded to */}
      {application.status !== 'need_info' && (application.needInfoPrompt || application.needInfoResponse) && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              История дозапроса сведений (T11 / T10)
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Сведения предоставлены
            </span>
          </div>
          {application.needInfoPrompt && (
            <div className="pl-3 border-l-2 border-amber-400 py-0.5">
              <span className="text-slate-500 block text-[11px]">Вопрос банка:</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{application.needInfoPrompt}</p>
            </div>
          )}
          {application.needInfoResponse && (
            <div className="pl-3 border-l-2 border-emerald-500 py-0.5">
              <span className="text-slate-500 block text-[11px]">Ответ заёмщика (ИП):</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{application.needInfoResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* T07 In Review by Specialist */}
      {application.status === 'review' && (
        <Alert
          type="info"
          title="Заявка на рассмотрении у специалиста банка"
        >
          Предварительные проверки сведений завершены. Кредитный специалист проверяет результаты расчёта и готовит персональные условия кредитования. Как только сотрудник одобрит условия, оферта появится в вашем кабинете.
        </Alert>
      )}

      {/* T08 / T12 Offer Card */}
      {application.status === 'offer' && application.offer && (
        <OfferCard
          offer={application.offer}
          onAccept={handleAcceptOffer}
          isLoading={isActionLoading}
        />
      )}

      {/* T09 / T13 Declined */}
      {application.status === 'declined' && (
        <Alert type="error" title="По заявке вынесен отказ">
          <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">
            Причина: {application.declineReason || 'Недостаточный скоринговый балл или несоответствие стоп-факторам.'}
          </p>
          Вы можете подать новую заявку через 30 дней после исправления замечаний.
        </Alert>
      )}

      {/* Main Content Grid: Application Parameters & Editing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Параметры кредита
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Сумма кредита</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatRubles(application.requestedAmount)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Срок</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {application.clientAnswers?.helpWithTerm
                        ? 'Подберёт банк'
                        : `${application.requestedTermMonths} месяцев`}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Стадия</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {application.businessType === 'operating' ? 'Действующий' : 'Prelaunch (новый)'}
                    </span>
                  </div>

                  {application.equipmentPrice ? (
                    <>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Стоимость оборудования</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatRubles(application.equipmentPrice)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Собственный взнос</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRubles(application.ownContribution || 0)}
                        </span>
                      </div>
                    </>
                  ) : null}

                  {application.businessType === 'operating' ? (
                    <>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Среднемесячная выручка</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatRubles(application.monthlyRevenue)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Ежемесячные расходы</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatRubles(application.monthlyExpenses)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-slate-400 dark:text-slate-500 block mb-1">Чистый денежный поток</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRubles((application.monthlyRevenue || 0) - (application.monthlyExpenses || 0))}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl col-span-2">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold block mb-1">
                        Источники покрытия долга (Prelaunch)
                      </span>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {application.clientAnswers?.repaymentSources?.length
                          ? `Заявлены: ${application.clientAnswers.repaymentSources.join(', ')}`
                          : 'Оценка по альтернативным доходам, поручительству или залогу'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Цель финансирования: </span>
                  <span className="text-slate-600 dark:text-slate-400">{application.purpose || 'Не указана'}</span>
                </div>
          </Card>

          {/* Card: История переходов заявки (полноценное окно под Параметры кредита) */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#EF3124] flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    История переходов
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {statusHistory.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Хронология изменения статусов и решений по заявке
                  </p>
                </div>
              </div>
            </div>

            {statusHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Пока нет записей в истории переходов
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {statusHistory.map((record, index) => {
                  const fromMeta = STATUS_MAP[record.fromStatus] || STATUS_MAP.draft;
                  const toMeta = STATUS_MAP[record.toStatus] || STATUS_MAP.draft;
                  const isLatest = index === statusHistory.length - 1;

                  return (
                    <div key={record.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[27px] top-2 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                          isLatest ? 'bg-[#EF3124] shadow-sm shadow-[#EF3124]/50' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />

                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3.5 space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-mono text-[11px]">
                              {record.transitionCode}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {TRANSITION_DESCRIPTIONS[record.transitionCode] || record.transitionCode}
                            </span>
                            {isLatest && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Текущий этап
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {formatDateTime(record.timestamp)}
                          </span>
                        </div>

                        {/* Transition flow */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {record.fromStatus === record.toStatus ? (
                            <span className={`px-2 py-0.5 rounded-full border text-[11px] ${toMeta.badgeClass}`}>
                              {toMeta.label}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full border text-[11px] ${fromMeta.badgeClass}`}>
                                {fromMeta.label}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              <span className={`px-2 py-0.5 rounded-full border text-[11px] ${toMeta.badgeClass}`}>
                                {toMeta.label}
                              </span>
                            </div>
                          )}
                          <div className="ml-auto">{getActorBadge(record.actor, record.actorName)}</div>
                        </div>

                        {record.comment && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                            «{record.comment}»
                          </p>
                        )}

                        {record.reasonCode && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Код причины:{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {record.reasonCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Scoring Card (only if scoring exists) */}
          {application.scoring && <ScoringCard scoring={application.scoring} />}
        </div>

        {/* Sidebar: Documents & Client Info */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-alfa-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Сведения о заёмщике</h4>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Наименование</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{companyTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">ИНН</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatInn(application.inn)}</span>
              </div>
            </div>
          </Card>

          {/* Uploaded Documents */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-alfa-500" />
                Документы ({documents.length})
              </h4>
            </div>

            <FileUpload
              onFileUploaded={handleFileUpload}
              onDeleteDocument={handleDeleteDocument}
              existingDocuments={documents}
            />
          </Card>

          {/* Согласия клиента */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-alfa-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Согласия по заявке</h4>
            </div>

            <div className="space-y-3 text-xs">
              {/* Согласие на обработку ПДн */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Обработка персональных данных</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">ПДн</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Предоставлено (ПЭП)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('pdn')}
                    className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 underline font-medium"
                  >
                    Подробнее ↗
                  </button>
                </div>
              </div>

              {/* Согласие на БКИ */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Запрос кредитной истории</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">БКИ</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Действует (6 мес.)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveConsentType('bki')}
                    className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 underline font-medium"
                  >
                    Подробнее ↗
                  </button>
                </div>
              </div>

              {/* Согласие на лизинг (если применимо) */}
              {(application.purposeCode === 'equipment' || (application.purpose && application.purpose.toLowerCase().includes('оборудован')) || application.clientAnswers?.leasing === 'yes') && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Передача в Альфа-Лизинг</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Лизинг</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Подтверждено
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveConsentType('leasing')}
                      className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 underline font-medium"
                    >
                      Подробнее ↗
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Need Info Response Modal (T10) */}
      <NeedInfoResponseModal
        isOpen={isNeedInfoModalOpen}
        onClose={() => setIsNeedInfoModalOpen(false)}
        promptText={application.needInfoPrompt || 'Предоставьте запрашиваемые банком сведения'}
        onSubmit={handleReplyNeedInfo}
        onFileUpload={handleFileUpload}
        uploadedDocuments={documents}
      />

      {/* Модальное окно просмотра текста согласия */}
      <ConsentModal
        isOpen={activeConsentType !== null}
        onClose={() => setActiveConsentType(null)}
        type={activeConsentType || 'pdn'}
        isAccepted={true}
        partnerName={application.leasingPartnerName || application.clientAnswers?.leasingPartnerName || 'ООО «Альфа-Лизинг» (ИНН 7707330770)'}
        applicantName={companyTitle}
        inn={application.inn}
      />
    </div>
  );
};
