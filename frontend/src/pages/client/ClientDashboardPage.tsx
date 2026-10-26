import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditApplication } from '../../types/application';
import { clientApi } from '../../api/clientApi';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { formatRubles, formatDateTime } from '../../utils/formatters';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export const ClientDashboardPage: React.FC = () => {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const data = await clientApi.getMyApplications();
      setApplications(data);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCount = applications.filter((a) => !['closed', 'declined'].includes(a.status)).length;
  const offerCount = applications.filter((a) => a.status === 'offer').length;
  const needInfoApplications = applications.filter((a) => a.status === 'need_info');
  const inProgressCount = applications.filter((a) => ['checking', 'waiting_check', 'need_info', 'review'].includes(a.status)).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Кредитный кабинет
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Управляйте кредитными заявками, отслеживайте статус и получайте решения онлайн
          </p>
        </div>

        <Link to="/client/new">
          <Button size="md" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Подать заявку на кредит
          </Button>
        </Link>
      </div>

      {/* Urgent Attention Alert for Need Info */}
      {needInfoApplications.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 uppercase tracking-wide">
                  Требуется ваш ответ
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  {needInfoApplications.length === 1 ? 'По 1 заявке' : `По ${needInfoApplications.length} заявкам`}
                </span>
              </div>
              <h3 className="font-bold text-sm mt-1 text-slate-900 dark:text-slate-100">
                Специалист банка ожидает пояснений или документов
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Рассмотрение продолжится сразу после отправки запрошенных сведений.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/client/applications/${needInfoApplications[0].id}`)}
            leftIcon={<MessageSquare className="w-4 h-4" />}
          >
            Ответить банку
          </Button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Активные заявки</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">На рассмотрении</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{inProgressCount}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Одобренные оферты</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{offerCount}</div>
          </div>
        </Card>
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ваши кредитные заявки</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Всего: {applications.length}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">Загрузка заявок...</div>
        ) : applications.length === 0 ? (
          <Card className="text-center py-12 space-y-3 border-dashed">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Заявок пока нет</h3>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app) => {
              const isNeedInfo = app.status === 'need_info';
              return (
                <Card
                  key={app.id}
                  className={`hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer p-5 ${
                    isNeedInfo
                      ? 'border-amber-400 bg-amber-50/20 dark:border-amber-600/80 ring-1 ring-amber-400/30'
                      : ''
                  }`}
                  onClick={() => navigate(`/client/applications/${app.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                          № {app.id}
                        </span>
                        <ApplicationStatusBadge status={app.status} />
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {app.businessType === 'operating' ? 'Действующий бизнес' : 'Новый бизнес (prelaunch)'}
                        </span>
                      </div>

                      <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {formatRubles(app.requestedAmount)}{' '}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          на {app.requestedTermMonths} мес.
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        Цель: {app.purpose}
                      </p>

                      {isNeedInfo && (
                        <div className="mt-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800 dark:text-amber-300">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Запрос банка к заёмщику:</span>
                          </div>
                          <p className="line-clamp-2 text-slate-800 dark:text-slate-200 font-medium">
                            «{app.needInfoPrompt || 'Банк запросил дополнительные пояснения или подтверждающие документы'}»
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="text-left md:text-right text-xs">
                        <span className="text-slate-400 dark:text-slate-500 block">Обновлено</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {formatDateTime(app.updatedAt)}
                        </span>
                      </div>

                      <Button
                        variant={isNeedInfo ? 'primary' : 'outline'}
                        size="sm"
                        rightIcon={isNeedInfo ? undefined : <ArrowRight className="w-3.5 h-3.5" />}
                        leftIcon={isNeedInfo ? <MessageSquare className="w-3.5 h-3.5" /> : undefined}
                      >
                        {isNeedInfo ? 'Ответить' : 'Открыть'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
