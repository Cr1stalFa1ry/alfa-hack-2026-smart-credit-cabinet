import React from 'react';
import { Modal } from '../common/Modal';
import { StateTransitionRecord } from '../../types/application';
import { formatDateTime } from '../../utils/formatters';
import { TRANSITION_DESCRIPTIONS, STATUS_MAP } from '../../utils/statusHelpers';
import { User, Cpu, ShieldAlert, ArrowRight } from 'lucide-react';

interface TransitionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: StateTransitionRecord[];
}

export const TransitionHistoryModal: React.FC<TransitionHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const getActorBadge = (actor: string, name: string) => {
    switch (actor) {
      case 'client':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
            <User className="w-3 h-3" /> {name || 'Клиент ИП'}
          </span>
        );
      case 'analyst':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
            <ShieldAlert className="w-3 h-3" /> {name || 'Аналитик'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <Cpu className="w-3 h-3" /> {name || 'SmartKabinet Engine'}
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Журнал переходов State Machine"
      description="Полный аудит всех состояний заявки согласно регламенту переходов T01–T17"
      maxWidth="lg"
    >
      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {history.map((record) => {
          const fromMeta = STATUS_MAP[record.fromStatus] || STATUS_MAP.draft;
          const toMeta = STATUS_MAP[record.toStatus] || STATUS_MAP.draft;

          return (
            <div key={record.id} className="relative">
              {/* Dot */}
              <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-alfa-500 ring-4 ring-white dark:ring-slate-900" />

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-alfa-100 dark:bg-alfa-950/70 text-alfa-800 dark:text-alfa-300 font-mono text-[11px]">
                      {record.transitionCode}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {TRANSITION_DESCRIPTIONS[record.transitionCode] || record.transitionCode}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatDateTime(record.timestamp)}
                  </span>
                </div>

                {/* Transition flow */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${fromMeta.badgeClass}`}>
                    {fromMeta.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${toMeta.badgeClass}`}>
                    {toMeta.label}
                  </span>
                  <div className="ml-auto">{getActorBadge(record.actor, record.actorName)}</div>
                </div>

                {record.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                    «{record.comment}»
                  </p>
                )}

                {record.reasonCode && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Код причины: <span className="font-semibold text-slate-700 dark:text-slate-200">{record.reasonCode}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
