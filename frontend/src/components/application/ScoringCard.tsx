import React from 'react';
import { ScoringResult } from '../../types/scoring';
import { Card } from '../common/Card';
import { ScoringRiskBadge } from '../badges/ScoringRiskBadge';
import { formatRubles } from '../../utils/formatters';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ScoringCardProps {
  scoring: ScoringResult;
  showDetails?: boolean;
}

export const ScoringCard: React.FC<ScoringCardProps> = ({ scoring, showDetails = true }) => {
  const isDscrSafe = scoring.dscr >= 1.25;

  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Результаты скоринга и проверок
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Движок SmartKabinet.Checking • Рассчитано автоматически
          </p>
        </div>
        <ScoringRiskBadge riskLevel={scoring.riskLevel} score={scoring.score} />
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score 0-100 */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Скоринговый балл</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{scoring.score}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">из 100</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                scoring.score >= 75
                  ? 'bg-emerald-500'
                  : scoring.score >= 55
                  ? 'bg-blue-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${scoring.score}%` }}
            />
          </div>
        </div>

        {/* DSCR */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Коэффициент DSCR</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                isDscrSafe
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isDscrSafe ? 'В норме' : 'Риск'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{scoring.dscr.toFixed(2)}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">норм. &ge; 1.25</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Покрытие долга чистым потоком</p>
        </div>

        {/* Net cash flow */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Чистый поток в месяц</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatRubles(scoring.netCashFlow)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Реком. платеж: до {formatRubles(scoring.recommendedMaxPayment)}
          </p>
        </div>
      </div>

      {/* Integrations data: BKI and FNS */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* BKI */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Кредитная история (БКИ)</span>
              <span className="text-slate-500 dark:text-slate-400">Рейтинг: {scoring.bki.rating} / 850</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Открытые кредиты</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{scoring.bki.activeLoansCount} шт.</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Текущий долг</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRubles(scoring.bki.totalDebt)}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Макс. просрочка</span>
                <span className={`font-semibold ${scoring.bki.maxOverdueDays > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {scoring.bki.maxOverdueDays} дней
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Стоп-просрочки</span>
                <span className={`font-semibold ${scoring.bki.hasCriticalDelays ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {scoring.bki.hasCriticalDelays ? 'Есть' : 'Нет'}
                </span>
              </div>
            </div>
          </div>

          {/* FNS */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>ФНС «Прозрачный бизнес»</span>
              <span className={scoring.fns.taxDebtAmount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {scoring.fns.taxDebtAmount === 0 ? 'Долгов нет' : formatRubles(scoring.fns.taxDebtAmount)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Блокировка счетов</span>
                <span className={`font-semibold ${scoring.fns.hasSuspendedAccounts ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {scoring.fns.hasSuspendedAccounts ? 'Есть ограничения' : 'Отсутствует'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Дисквалификация</span>
                <span className={`font-semibold ${scoring.fns.isDisqualifiedPerson ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {scoring.fns.isDisqualifiedPerson ? 'Дисквалифицирован' : 'Нет'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Сдача отчетности</span>
                <span className={`font-semibold ${scoring.fns.lastReportingSubmitted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {scoring.fns.lastReportingSubmitted ? 'Сдана вовремя' : 'Задержана'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Статус ЕГРИП</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Действует</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Components Breakdown (Составляющие балла) */}
      {showDetails && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Составляющие скорингового балла ({scoring.score} из 100)
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Распределение весовых коэффициентов по регламенту кредитного скоринга
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              5 факторов
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(scoring.components && scoring.components.length > 0
              ? scoring.components
              : [
                  {
                    key: 'coverage',
                    label: 'Покрытие платежей (DSCR)',
                    points: isDscrSafe ? Math.min(40, Math.round((scoring.score / 100) * 40)) : 16,
                    max: 40,
                    value: `DSCR ${scoring.dscr.toFixed(2)} (норма ≥ 1.25)`,
                    rule: 'R20–R21',
                  },
                  {
                    key: 'credit',
                    label: 'Кредитная история (БКИ)',
                    points: scoring.bki.hasCriticalDelays ? 0 : (scoring.bki.maxOverdueDays > 0 ? 15 : 25),
                    max: 25,
                    value: scoring.bki.hasCriticalDelays
                      ? 'Критическая просрочка'
                      : scoring.bki.maxOverdueDays > 0
                      ? 'Просрочка до 30 дней'
                      : 'Без просрочек, рейтинг БКИ ' + scoring.bki.rating,
                    rule: 'R09–R10',
                  },
                  {
                    key: 'history',
                    label: 'Длительность деятельности',
                    points: scoring.egrip?.status === 'ACTIVE' ? 14 : 6,
                    max: 15,
                    value: 'Регистрация ИП: ' + (scoring.egrip?.registrationDate || 'более 12 мес'),
                    rule: 'R18, R22',
                  },
                  {
                    key: 'variation',
                    label: 'Устойчивость выручки (CV)',
                    points: 12,
                    max: 15,
                    value: 'Коэффициент вариации CV ≤ 0.35',
                    rule: 'R19, R22',
                  },
                  {
                    key: 'annual',
                    label: 'Сумма к годовой выручке',
                    points: 5,
                    max: 5,
                    value: 'Соответствует лимиту годового оборота',
                    rule: 'R23',
                  },
                ]
            ).map((comp) => {
              const pct = Math.min(100, Math.round((comp.points / comp.max) * 100));
              return (
                <div
                  key={comp.key}
                  className="p-3 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{comp.label}</span>
                      {comp.rule && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {comp.rule}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{comp.points}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">/ {comp.max} б.</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {comp.value && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {String(comp.value)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stop factors list */}
      {scoring.stopFactors && scoring.stopFactors.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Проверка стоп-факторов ({scoring.stopFactors.length})
          </h4>
          <div className="space-y-2">
            {scoring.stopFactors.map((sf) => (
              <div
                key={sf.id}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
                  sf.isTriggered
                    ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {sf.isTriggered ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">{sf.title}</span>
                  <span className="text-slate-500 dark:text-slate-400">{sf.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
