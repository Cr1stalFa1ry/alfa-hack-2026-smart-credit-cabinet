import React from 'react';
import { ApplicationStatus } from '../../types/application';
import { Check, AlertTriangle, ShieldAlert } from 'lucide-react';

interface StateMachineStepperProps {
  status: ApplicationStatus;
}

export const StateMachineStepper: React.FC<StateMachineStepperProps> = ({ status }) => {
  // 4 high-level stages
  const stages = [
    {
      id: 'draft',
      label: 'Заполнение',
      description: 'Анкета и документы',
      statuses: ['draft'],
    },
    {
      id: 'checking',
      label: 'Скоринг и проверки',
      description: 'ЕГРИП, БКИ, ФНС',
      statuses: ['checking', 'waiting_check'],
    },
    {
      id: 'analysis',
      label: 'Рассмотрение',
      description: 'Андеррайтер / Уточнения',
      statuses: ['review', 'need_info'],
    },
    {
      id: 'decision',
      label: 'Решение',
      description: 'Оферта или отказ',
      statuses: ['offer', 'declined', 'closed'],
    },
  ];

  const getStageState = (stageIndex: number) => {
    const currentStageIndex = stages.findIndex((s) => s.statuses.includes(status));

    if (currentStageIndex > stageIndex) return 'completed';
    if (currentStageIndex === stageIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stages.map((stage, idx) => {
          const state = getStageState(idx);
          const isError = status === 'declined' && idx === 3;
          const isWaiting = status === 'waiting_check' && idx === 1;
          const isNeedInfo = status === 'need_info' && idx === 2;

          return (
            <div key={stage.id} className="relative flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  isError
                    ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400'
                    : isWaiting
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400 animate-pulse'
                    : isNeedInfo
                    ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 ring-2 ring-orange-400 animate-bounce'
                    : state === 'completed'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : state === 'current'
                    ? 'bg-alfa-500 text-white shadow-sm shadow-alfa-500/25 ring-2 ring-alfa-200 dark:ring-alfa-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {state === 'completed' ? (
                  <Check className="w-4 h-4" />
                ) : isWaiting || isNeedInfo ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isError ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-bold truncate ${
                    state === 'current'
                      ? 'text-slate-900 dark:text-white'
                      : state === 'completed'
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
