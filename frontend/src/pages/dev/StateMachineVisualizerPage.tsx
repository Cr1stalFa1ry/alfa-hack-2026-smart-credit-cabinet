import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { mockStore } from '../../api/mockStore';
import { TransitionCode, ApplicationStatus, ActorRole } from '../../types/application';
import { RotateCcw, Cpu, ArrowRight } from 'lucide-react';

interface TransitionRule {
  code: TransitionCode;
  from: ApplicationStatus | string;
  to: ApplicationStatus;
  actor: ActorRole;
  title: string;
  rule: string;
}

export const StateMachineVisualizerPage: React.FC = () => {
  const transitions: TransitionRule[] = [
    {
      code: 'T01',
      from: 'Старт',
      to: 'draft',
      actor: 'client',
      title: 'Создать черновик',
      rule: 'Клиент начинает заполнять кредитную анкету',
    },
    {
      code: 'T02',
      from: 'draft',
      to: 'draft',
      actor: 'client',
      title: 'Сохранить черновик',
      rule: 'Промежуточное сохранение данных анкеты',
    },
    {
      code: 'T03',
      from: 'draft',
      to: 'checking',
      actor: 'client',
      title: 'Отправить заявку',
      rule: 'Анкета отправляется в движок скоринга и проверок',
    },
    {
      code: 'T04',
      from: 'checking',
      to: 'need_info',
      actor: 'system',
      title: 'Нужны сведения',
      rule: 'Автоматический скоринг требует подтверждающие документы',
    },
    {
      code: 'T05',
      from: 'checking',
      to: 'waiting_check',
      actor: 'system',
      title: 'Источник недоступен',
      rule: 'Ошибка 503 SOURCE_UNAVAILABLE от ФНС/БКИ, заявка ждет повтора',
    },
    {
      code: 'T06',
      from: 'waiting_check',
      to: 'checking',
      actor: 'client',
      title: 'Повторить проверку',
      rule: 'Повторный запуск проверки клиентом или таймером',
    },
    {
      code: 'T07',
      from: 'checking',
      to: 'review',
      actor: 'system',
      title: 'Передать аналитику',
      rule: 'Сумма > 2 млн, бизнес prelaunch или расхождения в данных',
    },
    {
      code: 'T08',
      from: 'checking',
      to: 'offer',
      actor: 'system',
      title: 'Авто-одобрение',
      rule: 'Высокий скоринг, DSCR >= 1.25, стоп-факторы чистые',
    },
    {
      code: 'T09',
      from: 'checking',
      to: 'declined',
      actor: 'system',
      title: 'Авто-отказ',
      rule: 'Сработал критический стоп-фактор (просрочки БКИ, арест счетов)',
    },
    {
      code: 'T10',
      from: 'need_info',
      to: 'checking',
      actor: 'client',
      title: 'Ответ на запрос',
      rule: 'Клиент предоставил запрошенные документы/ответ',
    },
    {
      code: 'T11',
      from: 'review',
      to: 'need_info',
      actor: 'analyst',
      title: 'Запрос аналитика',
      rule: 'Сотрудник банка запрашивает уточнения у заёмщика',
    },
    {
      code: 'T12',
      from: 'review',
      to: 'offer',
      actor: 'analyst',
      title: 'Решение аналитика',
      rule: 'Ручное одобрение андеррайтером с выставлением ставки и лимита',
    },
    {
      code: 'T13',
      from: 'review',
      to: 'declined',
      actor: 'analyst',
      title: 'Отказ аналитика',
      rule: 'Экспертный отказ с указанием прозрачной причины',
    },
    {
      code: 'T14',
      from: 'review',
      to: 'checking',
      actor: 'analyst',
      title: 'Факты уточнены',
      rule: 'Возврат на автоматический пересчет скоринга',
    },
    {
      code: 'T15',
      from: 'checking',
      to: 'need_info',
      actor: 'system',
      title: 'Повторный запрос инфо',
      rule: 'Повторный скоринг выявил недостающие данные',
    },
    {
      code: 'T16',
      from: 'checking/review',
      to: 'closed',
      actor: 'system',
      title: 'Некредитное препятствие',
      rule: 'Неподходящие параметры продукта (PRODUCT_NA_AMOUNT)',
    },
    {
      code: 'T17',
      from: 'any',
      to: 'closed',
      actor: 'client',
      title: 'Отзыв заявки',
      rule: 'Клиент отозвал заявку по собственной инициативе',
    },
  ];

  const handleResetData = () => {
    if (window.confirm('Сбросить все тестовые заявки к исходному состоянию?')) {
      mockStore.reset();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Спецификация State Machine (T01–T17)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Конечный автомат жизненного цикла кредитной заявки ядра SmartKabinet.Application
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetData}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Сбросить демо-данные к начальным
        </Button>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 dark:bg-slate-900/90 border-slate-800 text-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Инвариант 1
          </span>
          <h4 className="text-sm font-bold mt-1 text-white">Централизованная валидация</h4>
          <p className="text-xs text-slate-300 mt-1">
            Любые переходы осуществляются строго через конечный автомат ядра заявок.
          </p>
        </Card>

        <Card className="bg-slate-900 dark:bg-slate-900/90 border-slate-800 text-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Инвариант 2
          </span>
          <h4 className="text-sm font-bold mt-1 text-white">Непрерывный аудит</h4>
          <p className="text-xs text-slate-300 mt-1">
            Каждый переход сохраняет: previousStatus, newStatus, actor, reasonCode, timestamp.
          </p>
        </Card>

        <Card className="bg-slate-900 dark:bg-slate-900/90 border-slate-800 text-white p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Инвариант 3
          </span>
          <h4 className="text-sm font-bold mt-1 text-white">Разграничение отказов</h4>
          <p className="text-xs text-slate-300 mt-1">
            Ошибки 503 (SOURCE_UNAVAILABLE) не ведут к отказу, переводя заявку в waiting_check (T06).
          </p>
        </Card>
      </div>

      {/* Table of transitions */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Реестр 17 переходов состояний (T01–T17)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Код</th>
                <th className="py-3 px-4">Переход</th>
                <th className="py-3 px-4">Инициатор (Actor)</th>
                <th className="py-3 px-4">Название</th>
                <th className="py-3 px-4">Бизнес-правило</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transitions.map((t) => (
                <tr key={t.code} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="py-3 px-4 font-mono font-bold text-alfa-600 dark:text-alfa-400">
                    {t.code}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <span className="text-slate-600 dark:text-slate-400">{t.from}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="font-bold text-slate-900 dark:text-white">{t.to}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                        t.actor === 'client'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : t.actor === 'analyst'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {t.actor}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {t.title}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {t.rule}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
