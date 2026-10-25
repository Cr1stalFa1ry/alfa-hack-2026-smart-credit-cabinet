import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditApplication } from '../../types/application';
import { analystApi } from '../../api/analystApi';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ApplicationStatusBadge } from '../../components/badges/ApplicationStatusBadge';
import { ScoringRiskBadge } from '../../components/badges/ScoringRiskBadge';
import { formatRubles, formatInn } from '../../utils/formatters';
import {
  ShieldCheck,
  Search,
  ArrowRight,
} from 'lucide-react';

export const AnalystQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await analystApi.getReviewQueue();
      // Исключаем черновики: сотрудник банка работает только с отправленными заявками
      const submittedOnly = data.filter((a) => a.status !== 'draft');
      setApplications(submittedOnly);
    } finally {
      setIsLoading(false);
    }
  };

  const reviewCount = applications.filter((a) => a.status === 'review').length;
  const needInfoCount = applications.filter((a) => a.status === 'need_info').length;
  const offerCount = applications.filter((a) => a.status === 'offer').length;
  const checkingCount = applications.filter((a) => a.status === 'checking').length;

  const filteredApplications = applications.filter((app) => {
    if (app.status === 'draft') return false;
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    const company = app.companyName || `ИП (ИНН ${app.inn || ''})`;
    const inn = app.inn || '';
    const id = app.id || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      company.toLowerCase().includes(q) ||
      inn.includes(q) ||
      id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Очередь андеррайтинга
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Рабочее место кредитного аналитика банка • Оценка рисков и ручной разбор заявок (T07)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Требуют внимания: <span className="font-extrabold">{reviewCount}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Поиск по наименованию ИП, ИНН или номеру заявки..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Все заявки', count: applications.length },
              { id: 'review', label: 'На разборе', count: reviewCount },
              { id: 'need_info', label: 'Ожидают инфо', count: needInfoCount },
              { id: 'offer', label: 'Одобрено', count: offerCount },
              { id: 'checking', label: 'На проверке', count: checkingCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Queue items table / cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">Загрузка очереди...</div>
        ) : filteredApplications.length === 0 ? (
          <Card className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-3">
            <p>
              {applications.length === 0
                ? 'В очереди пока нет заявок. Создайте заявку от лица клиента ИП в кредитном кабинете.'
                : `В категории «${
                    filterStatus === 'review'
                      ? 'На разборе'
                      : filterStatus === 'need_info'
                      ? 'Ожидают инфо'
                      : filterStatus === 'offer'
                      ? 'Одобрено'
                      : filterStatus === 'checking'
                      ? 'На проверке'
                      : 'Все'
                  }» нет заявок.`}
            </p>
            {applications.length > 0 && filterStatus !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="mt-2"
              >
                Показать все заявки ({applications.length})
              </Button>
            )}
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card
              key={app.id}
              className="hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all cursor-pointer p-5"
              onClick={() => navigate(`/analyst/review/${app.id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                      {app.id}
                    </span>
                    <ApplicationStatusBadge status={app.status} />
                    {app.scoring && (
                      <ScoringRiskBadge
                        riskLevel={app.scoring.riskLevel}
                        score={app.scoring.score}
                      />
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      ИНН {formatInn(app.inn)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {app.companyName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Цель: {app.purpose} • Тип:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {app.businessType === 'operating' ? 'Действующий' : 'Prelaunch'}
                      </span>
                      {(app.businessType === 'prelaunch' || app.stage === 'prelaunch') && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {app.purposeCode === 'equipment' || (app.purpose && app.purpose.toLowerCase().includes('оборудован'))
                            ? 'Специалист по лизингу'
                            : 'Финансирование под залог'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right KPIs & CTA */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] uppercase text-slate-400 dark:text-slate-500 font-semibold block">
                      Запрос
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatRubles(app.requestedAmount)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">
                      на {app.requestedTermMonths} мес.
                    </span>
                  </div>

                  {app.scoring && (
                    <div className="text-left lg:text-right text-xs">
                      <span className="text-[11px] uppercase text-slate-400 dark:text-slate-500 font-semibold block">
                        DSCR
                      </span>
                      <span
                        className={`text-sm font-black ${
                          app.scoring.dscr >= 1.25
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {app.scoring.dscr.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Перейти к оценке
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
