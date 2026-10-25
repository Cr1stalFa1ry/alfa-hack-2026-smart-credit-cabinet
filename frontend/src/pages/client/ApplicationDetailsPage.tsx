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
import { TransitionHistoryModal } from '../../components/application/TransitionHistoryModal';
import { FileUpload } from '../../components/common/FileUpload';
import { ConsentModal, ConsentType } from '../../components/application/ConsentModal';
import { NewApplicationWizardPage } from './NewApplicationWizardPage';
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
  ShieldCheck,
  Check,
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeConsentType, setActiveConsentType] = useState<ConsentType | null>(null);

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
              {application.productCode && <ProductCodeBadge code={application.productCode} size="sm" />}
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

      {/* T07 In Review by Specialist */}
      {application.status === 'review' && (
        <Alert
          type="info"
          title="Заявка на рассмотрении у специалиста банка"
        >
          Скоринг и предварительные проверки завершены. Кредитный специалист проверяет результаты расчёта и готовит персональные условия кредитования. Как только сотрудник одобрит условия, оферта появится в вашем кабинете.
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

      {/* Transition History Modal (Audit Log) */}
      {history.length > 0 && (
        <TransitionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          history={history}
        />
      )}

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
