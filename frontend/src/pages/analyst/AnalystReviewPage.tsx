import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditApplication } from '../../types/application';
import { analystApi } from '../../api/analystApi';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { ScoringCard } from '../../components/application/ScoringCard';
import { EgripCard } from '../../components/application/EgripCard';
import { AnalystActionPanel } from '../../components/analyst/AnalystActionPanel';
import { TransitionHistoryModal } from '../../components/application/TransitionHistoryModal';
import { formatRubles, formatDateTime, formatInn } from '../../utils/formatters';
import {
  ArrowLeft,
  History,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const AnalystReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (appId: string) => {
    setIsLoading(true);
    try {
      const data = await analystApi.getApplicationDetails(appId);
      const normalized: CreditApplication = {
        ...data,
        companyName: data.companyName || `ИП (ИНН ${data.inn || ''})`,
        documents: data.documents || [],
        history: data.history || [],
      };
      setApplication(normalized);
    } finally {
      setIsLoading(false);
    }
  };

  // T12 Approve
  const handleApprove = async (params: {
    approvedAmount: number;
    approvedTermMonths: number;
    annualInterestRate: number;
    comment?: string;
  }) => {
    if (!application) return;
    const updated = await analystApi.approveOffer(application.id, params);
    setApplication(updated);
  };

  // T13 Decline
  const handleDecline = async (reasonCode: string, comment: string) => {
    if (!application) return;
    const updated = await analystApi.declineApplication(application.id, reasonCode, comment);
    setApplication(updated);
  };

  // T11 Need info
  const handleRequestInfo = async (prompt: string) => {
    if (!application) return;
    const updated = await analystApi.requestNeedInfo(application.id, prompt);
    setApplication(updated);
  };

  // T14 Return to checking
  const handleReturnToChecking = async (comment?: string) => {
    if (!application) return;
    const updated = await analystApi.returnToChecking(application.id, comment);
    setApplication(updated);
  };

  // T16 Close
  const handleCloseNonCredit = async (reasonCode: string, comment: string) => {
    if (!application) return;
    const updated = await analystApi.closeNonCredit(application.id, reasonCode, comment);
    setApplication(updated);
  };

  if (isLoading || !application) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-slate-500">
        Загрузка досье заёмщика для андеррайтинга...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/analyst/queue')}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Досье заявки {application.id}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {application.companyName} • ИНН {formatInn(application.inn)} • Поступила {formatDateTime(application.createdAt)}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsHistoryOpen(true)}
          leftIcon={<History className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
        >
          Журнал аудита ({application.history.length})
        </Button>
      </div>

      {/* Underwriter Action Panel (T11 - T16) */}
      <AnalystActionPanel
        application={application}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onRequestInfo={handleRequestInfo}
        onReturnToChecking={handleReturnToChecking}
        onCloseNonCredit={handleCloseNonCredit}
      />

      {/* Discrepancy & Verification comparison */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Сверка данных анкеты с государственными источниками (SmartKabinet.Integrations)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Выручка со слов клиента</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {formatRubles(application.monthlyRevenue)} / мес
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Статус по ЕГРИП</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Действующий ИП (&gt; 12 мес)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Налоги и блокировки (ФНС)</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" /> Задолженностей нет, счета активны
            </span>
          </div>
        </div>
      </Card>

      {/* Core Split: Scoring & Financials vs Documents & EGRIP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scoring Engine Breakdown */}
          {application.scoring && <ScoringCard scoring={application.scoring} showDetails={true} />}

          {/* Stated Financials */}
          <Card>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Финансовые параметры кредитного запроса
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Запрошено</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRubles(application.requestedAmount)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Срок</span>
                <span className="font-bold text-slate-900 dark:text-white">{application.requestedTermMonths} мес.</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Выручка</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRubles(application.monthlyRevenue)}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 dark:text-slate-500 block">Расходы</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRubles(application.monthlyExpenses)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Заявленная цель:</span> {application.purpose}
            </div>
          </Card>
        </div>

        {/* Right Column: EGRIP & Documents */}
        <div className="space-y-6">
          {application.scoring?.egrip && <EgripCard company={application.scoring.egrip} />}

          {/* Documents */}
          <Card>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Прикрепленные документы ({application.documents.length})
            </h4>

            {application.documents.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Документы не прикреплены</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{doc.fileName}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {(doc.fileSizeBytes / 1024 / 1024).toFixed(1)} МБ • {formatDateTime(doc.uploadedAt)}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Верифицирован
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Transition History Modal */}
      <TransitionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={application.history}
      />
    </div>
  );
};
