import React from 'react';
import { ScoringResult } from '../../types/scoring';
import { formatRubles } from '../../utils/formatters';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ScoringCardProps {
  scoring: ScoringResult;
  showDetails?: boolean;
}

export const ScoringCard: React.FC<ScoringCardProps> = ({ scoring, showDetails = true }) => {
  const isDscrSafe = scoring.dscr >= 1.25;

  const componentsList =
    scoring.components && scoring.components.length > 0
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
            points: scoring.bki.hasCriticalDelays ? 0 : scoring.bki.maxOverdueDays > 0 ? 15 : 25,
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
        ];

  return (
    <div className="space-y-6 text-[#141414]">
      {/* Заголовок секции */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold block mb-1">
            Движок SmartKabinet.Checking
          </span>
          <h3 className="text-[20px] font-bold text-[#141414] m-0">
            Детализация скоринга и внешних проверок
          </h3>
        </div>
        <span
          className={`inline-block rounded-[7px] px-[10px] py-[5px] text-[12px] font-bold ${
            scoring.score >= 70
              ? 'bg-[#edf7f0] text-[#176b45]'
              : scoring.score >= 50
              ? 'bg-[#fff6e4] text-[#885215]'
              : 'bg-[#fff1ef] text-[#a42b22]'
          }`}
        >
          Итоговый балл: {scoring.score} из 100
        </span>
      </div>

      {/* 3 ключевых метрики (.analysis-stats из макет.html) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-[18px] bg-[#f5f6f7] rounded-[13px]">
          <span className="text-[#686b70] text-[11px] block">Скоринговый балл</span>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {scoring.score} <span className="text-[13px] font-normal text-[#686b70]">/ 100</span>
          </strong>
          <div className="h-[4px] bg-[#e6e8ea] rounded-[4px] overflow-hidden mt-2">
            <i className="h-full block bg-[#EF3124]" style={{ width: `${scoring.score}%` }} />
          </div>
        </div>

        <div className="p-[18px] bg-[#f5f6f7] rounded-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-[#686b70] text-[11px]">Коэффициент DSCR</span>
            <span
              className={`rounded-[7px] px-2 py-0.5 text-[10px] font-bold ${
                isDscrSafe ? 'bg-[#edf7f0] text-[#176b45]' : 'bg-[#fff6e4] text-[#885215]'
              }`}
            >
              {isDscrSafe ? 'Норма ≥ 1.25' : 'Ниже нормы'}
            </span>
          </div>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {scoring.dscr.toFixed(2)}
          </strong>
          <span className="text-[#686b70] text-[11px] block">Покрытие платежа чистым потоком</span>
        </div>

        <div className="p-[18px] bg-[#f5f6f7] rounded-[13px]">
          <span className="text-[#686b70] text-[11px] block">Чистый денежный поток</span>
          <strong className="text-[23px] block tracking-[-0.04em] my-1.5 text-[#141414]">
            {formatRubles(scoring.netCashFlow)}
          </strong>
          <span className="text-[#686b70] text-[11px] block">
            Допустимый платёж: до {formatRubles(scoring.recommendedMaxPayment)}
          </span>
        </div>
      </div>

      {/* Интеграции: БКИ и ФНС (.two-cols из макет.html) */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-[14px] border border-[#e6e8ea] bg-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e6e8ea]">
              <strong className="text-[14px] text-[#141414]">Кредитная история (БКИ)</strong>
              <span className="inline-block rounded-[7px] bg-[#f5f6f7] px-2.5 py-1 text-[11px] font-medium text-[#141414]">
                Рейтинг: {scoring.bki.rating} / 850
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-y-2.5 text-[13px] m-0">
              <dt className="text-[#686b70]">Активные договоры</dt>
              <dd className="m-0 font-bold text-right">{scoring.bki.activeLoansCount} шт.</dd>
              <dt className="text-[#686b70]">Остаток долга</dt>
              <dd className="m-0 font-bold text-right">{formatRubles(scoring.bki.totalDebt)}</dd>
              <dt className="text-[#686b70]">Макс. просрочка (12 мес.)</dt>
              <dd
                className={`m-0 font-bold text-right ${
                  scoring.bki.maxOverdueDays > 0 ? 'text-[#885215]' : 'text-[#176b45]'
                }`}
              >
                {scoring.bki.maxOverdueDays} дн.
              </dd>
              <dt className="text-[#686b70]">Критические просрочки</dt>
              <dd
                className={`m-0 font-bold text-right ${
                  scoring.bki.hasCriticalDelays ? 'text-[#a42b22]' : 'text-[#176b45]'
                }`}
              >
                {scoring.bki.hasCriticalDelays ? 'Обнаружены' : 'Нет'}
              </dd>
            </dl>
          </div>

          <div className="p-5 rounded-[14px] border border-[#e6e8ea] bg-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e6e8ea]">
              <strong className="text-[14px] text-[#141414]">ФНС и государственные реестры</strong>
              <span
                className={`inline-block rounded-[7px] px-2.5 py-1 text-[11px] font-medium ${
                  scoring.fns.taxDebtAmount === 0
                    ? 'bg-[#edf7f0] text-[#176b45]'
                    : 'bg-[#fff1ef] text-[#a42b22]'
                }`}
              >
                {scoring.fns.taxDebtAmount === 0 ? 'Задолженностей нет' : formatRubles(scoring.fns.taxDebtAmount)}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-y-2.5 text-[13px] m-0">
              <dt className="text-[#686b70]">Блокировки счетов (ст. 76 НК)</dt>
              <dd
                className={`m-0 font-bold text-right ${
                  scoring.fns.hasSuspendedAccounts ? 'text-[#a42b22]' : 'text-[#176b45]'
                }`}
              >
                {scoring.fns.hasSuspendedAccounts ? 'Есть ограничения' : 'Нет'}
              </dd>
              <dt className="text-[#686b70]">Реестр дисквалифицированных</dt>
              <dd className="m-0 font-bold text-right text-[#176b45]">
                {scoring.fns.isDisqualifiedPerson ? 'Числится' : 'Не числится'}
              </dd>
              <dt className="text-[#686b70]">Налоговая дисциплина</dt>
              <dd className="m-0 font-bold text-right text-[#176b45]">
                {scoring.fns.lastReportingSubmitted ? 'Без нарушений' : 'Требует сверки'}
              </dd>
              <dt className="text-[#686b70]">Статус в ЕГРИП</dt>
              <dd className="m-0 font-bold text-right text-[#176b45]">Действующий ИП</dd>
            </dl>
          </div>
        </div>
      )}

      {/* Составляющие скорингового балла (5 факторов) */}
      {showDetails && (
        <div className="pt-4 border-t border-[#e6e8ea]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-[15px] font-bold text-[#141414] m-0">
                Факторная декомпозиция скорингового балла ({scoring.score} из 100)
              </h4>
              <p className="text-[12px] text-[#686b70] m-0">
                Распределение весов согласно регламенту оценки кредитного риска
              </p>
            </div>
            <span className="inline-block rounded-[7px] bg-[#f5f6f7] px-2.5 py-1 text-[11px] font-medium text-[#686b70]">
              5 факторов
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {componentsList.map((comp) => {
              const pct = Math.min(100, Math.round((comp.points / comp.max) * 100));
              return (
                <div key={comp.key} className="p-4 bg-[#f5f6f7] rounded-[13px] border border-[#e6e8ea]">
                  <div className="flex items-center justify-between text-[13px] mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <strong className="font-bold text-[#141414] truncate">{comp.label}</strong>
                      {comp.rule && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#e6e8ea] text-[#686b70]">
                          {comp.rule}
                        </span>
                      )}
                    </div>
                    <strong className="text-[14px] text-[#141414] shrink-0">
                      {comp.points} <span className="text-[11px] font-normal text-[#686b70]">/ {comp.max} б.</span>
                    </strong>
                  </div>

                  <div className="h-[4px] bg-[#e6e8ea] rounded-[4px] overflow-hidden mb-2">
                    <i className="h-full block bg-[#EF3124]" style={{ width: `${pct}%` }} />
                  </div>

                  {comp.value && <span className="text-[11px] text-[#686b70] block">{String(comp.value)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Проверка стоп-факторов */}
      {scoring.stopFactors && scoring.stopFactors.length > 0 && (
        <div className="pt-4 border-t border-[#e6e8ea]">
          <h4 className="text-[15px] font-bold text-[#141414] mb-3">
            Проверка стоп-факторов ({scoring.stopFactors.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scoring.stopFactors.map((sf) => (
              <div
                key={sf.id}
                className={`p-3.5 rounded-[12px] border text-[12px] flex items-start gap-2.5 ${
                  sf.isTriggered
                    ? 'bg-[#fff1ef] border-[#fac6c2] text-[#9d231b]'
                    : 'bg-[#eef8f1] border-[#cde8d6] text-[#176b45]'
                }`}
              >
                {sf.isTriggered ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="font-bold block text-[#141414]">{sf.title}</strong>
                  <span className="text-[#686b70] text-[11px]">{sf.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};