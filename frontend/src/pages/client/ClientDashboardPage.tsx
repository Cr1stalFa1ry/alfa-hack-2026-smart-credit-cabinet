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
  const inProgressCount = applications.filter((a) => ['checking', 'waiting_check', 'need_info', 'review'].includes(a.status)).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Кредитный кабинет заёмщика
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
          <Card className="text-center py-12 space-y-4 border-dashed">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Заявок пока нет</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Оформите экспресс-заявку: решение за несколько минут на основе умного скоринга
              </p>
            </div>
            <Link to="/client/new">
              <Button variant="primary" size="sm">
                Создать первую заявку
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer p-5"
                onClick={() => navigate(`/client/applications/${app.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
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
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right text-xs">
                      <span className="text-slate-400 dark:text-slate-500 block">Обновлено</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDateTime(app.updatedAt)}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Открыть
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
