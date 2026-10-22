import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditApplication, BusinessType } from '../../types/application';
import { clientApi } from '../../api/clientApi';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { StateMachineStepper } from '../../components/application/StateMachineStepper';
import { ScoringCard } from '../../components/application/ScoringCard';
import { OfferCard } from '../../components/application/OfferCard';
import { NeedInfoResponseModal } from '../../components/application/NeedInfoResponseModal';
import { TransitionHistoryModal } from '../../components/application/TransitionHistoryModal';
import { FileUpload } from '../../components/common/FileUpload';
import { formatRubles, formatDateTime, formatInn } from '../../utils/formatters';
import {
  ArrowLeft,
  History,
  RotateCcw,
  Send,
  MessageSquare,
  XCircle,
  FileText,
  Building2,
  Edit3,
  Save,
  Check,
} from 'lucide-react';

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Edit draft state
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editTerm, setEditTerm] = useState<number>(12);
  const [editPurpose, setEditPurpose] = useState('');
  const [editRevenue, setEditRevenue] = useState<number>(0);
  const [editExpenses, setEditExpenses] = useState<number>(0);
  const [editBusinessType, setEditBusinessType] = useState<BusinessType>('operating');

  // Modals
  const [isNeedInfoModalOpen, setIsNeedInfoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

      // Initialize edit fields
      setEditAmount(data.requestedAmount || 1000000);
      setEditTerm(data.requestedTermMonths || 12);
      setEditPurpose(data.purpose || '');
      setEditRevenue(data.monthlyRevenue || 0);
      setEditExpenses(data.monthlyExpenses || 0);
      setEditBusinessType(data.businessType || 'operating');

      if (data.status === 'draft') {
        setIsEditingDraft(true);
      }
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // T02: Save Draft changes
  const handleSaveDraft = async () => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      const updated = await clientApi.updateDraft(application.id, {
        requestedAmount: Number(editAmount),
        requestedTermMonths: Number(editTerm),
        purpose: editPurpose,
        monthlyRevenue: Number(editRevenue),
        monthlyExpenses: Number(editExpenses),
        businessType: editBusinessType,
      });

      const normalized: CreditApplication = {
        ...updated,
        companyName: updated.companyName || application.companyName,
        documents: updated.documents || application.documents || [],
        history: updated.history || application.history || [],
      };
      setApplication(normalized);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 3000);
    } finally {
      setIsActionLoading(false);
    }
  };

  // T03: Submit draft to checking
  const handleSubmitDraft = async () => {
    if (!application) return;
    setIsActionLoading(true);
    try {
      // First save any unsaved draft edits
      await clientApi.updateDraft(application.id, {
        requestedAmount: Number(editAmount),
        requestedTermMonths: Number(editTerm),
        purpose: editPurpose,
        monthlyRevenue: Number(editRevenue),
        monthlyExpenses: Number(editExpenses),
        businessType: editBusinessType,
      });

      const updated = await clientApi.submitApplication(application.id);
      const normalized: CreditApplication = {
        ...updated,
        companyName: updated.companyName || application.companyName,
        documents: updated.documents || application.documents || [],
        history: updated.history || application.history || [],
      };
      setApplication(normalized);
      setIsEditingDraft(false);
    } finally {
      setIsActionLoading(false);
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

  const documents = application.documents || [];
  const history = application.history || [];
  const companyTitle = application.companyName || `ИП (ИНН ${application.inn})`;

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
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Создана: {formatDateTime(application.createdAt)} • {companyTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              leftIcon={<History className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
            >
              История переходов ({history.length})
            </Button>
          )}

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

      {/* State Machine Stepper */}
      <StateMachineStepper status={application.status} />

      {/* Saved Notification */}
      {isSavedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" /> Изменения в черновике сохранены (T02)
        </div>
      )}

      {/* Special State Banners */}
      {/* Draft State */}
      {application.status === 'draft' && (
        <Alert
          type="info"
          title="Заявка находится в статусе черновика (T01/T02)"
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveDraft}
                isLoading={isActionLoading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Сохранить черновик (T02)
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSubmitDraft}
                isLoading={isActionLoading}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Отправить заявку в банк (T03)
              </Button>
            </div>
          }
        >
          Вы можете отредактировать финансовые параметры, прикрепить документы и отправить заявку на экспресс-скоринг.
        </Alert>
      )}

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

      {/* T04 / T11 Need Info */}
      {application.status === 'need_info' && (
        <Alert
          type="warning"
          title="Банк запросил дополнительные сведения"
          action={
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsNeedInfoModalOpen(true)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Предоставить сведения (T10)
            </Button>
          }
        >
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {application.needInfoPrompt || 'Пожалуйста, прикрепите подтверждающие документы или уточните данные.'}
          </p>
          Ответьте на запрос, чтобы заявка вернулась на скоринг.
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
                {application.status === 'draft' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-alfa-50 dark:bg-alfa-950/50 text-alfa-600 dark:text-alfa-400 font-normal">
                    Режим редактирования черновика
                  </span>
                )}
              </h3>

              {application.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => setIsEditingDraft((prev) => !prev)}
                  className="text-xs font-semibold text-alfa-600 dark:text-alfa-400 hover:text-alfa-700 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingDraft ? 'Свернуть форму' : 'Редактировать'}
                </button>
              )}
            </div>

            {application.status === 'draft' && isEditingDraft ? (
              /* Interactive Draft Edit Form */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Запрашиваемая сумма (₽)"
                    type="number"
                    step="50000"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    helperText={`Сумма: ${formatRubles(editAmount)}`}
                  />

                  <Select
                    label="Срок кредита"
                    value={editTerm}
                    onChange={(e) => setEditTerm(Number(e.target.value))}
                    options={[
                      { value: 12, label: '12 месяцев (1 год)' },
                      { value: 18, label: '18 месяцев (1.5 года)' },
                      { value: 24, label: '24 месяца (2 года)' },
                      { value: 36, label: '36 месяцев (3 года)' },
                      { value: 48, label: '48 месяцев (4 года)' },
                    ]}
                  />
                </div>

                <Input
                  label="Цель кредитования"
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  placeholder="Например: покупка оборудования, аренда, оборотные средства"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Среднемесячная выручка (₽)"
                    type="number"
                    step="10000"
                    value={editRevenue}
                    onChange={(e) => setEditRevenue(Number(e.target.value))}
                  />

                  <Input
                    label="Среднемесячные расходы (₽)"
                    type="number"
                    step="10000"
                    value={editExpenses}
                    onChange={(e) => setEditExpenses(Number(e.target.value))}
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Расчетный чистый поток:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {formatRubles(editRevenue - editExpenses)} / мес
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    isLoading={isActionLoading}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Сохранить изменения (T02)
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitDraft}
                    isLoading={isActionLoading}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Отправить в банк (T03)
                  </Button>
                </div>
              </div>
            ) : (
              /* Read-only details view */
              <>
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
                      {application.requestedTermMonths} месяцев
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Стадия</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {application.businessType === 'operating' ? 'Действующий' : 'Prelaunch'}
                    </span>
                  </div>

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
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Цель финансирования: </span>
                  <span className="text-slate-600 dark:text-slate-400">{application.purpose || 'Не указана'}</span>
                </div>
              </>
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
              existingDocuments={documents}
            />
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

      {/* Transition History Modal (Audit Log) */}
      {history.length > 0 && (
        <TransitionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          history={history}
        />
      )}
    </div>
  );
};
