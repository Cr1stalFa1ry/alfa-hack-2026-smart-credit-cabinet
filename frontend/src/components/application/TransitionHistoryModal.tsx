import React from 'react';
import { Modal } from '../common/Modal';
import { StateTransitionRecord } from '../../types/application';
import { formatDateTime } from '../../utils/formatters';
import { TRANSITION_DESCRIPTIONS, STATUS_MAP } from '../../utils/statusHelpers';

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
  const filteredHistory = history.filter((record) => {
    const isAutosave =
      record.transitionCode === 'T02' ||
      (record.fromStatus === 'draft' &&
        record.toStatus === 'draft' &&
        (record.comment?.includes('T02') || record.comment?.includes('Сохранены изменения')));
    return !isAutosave;
  });

  const getActorLabel = (actor: string, name?: string) => {
    if (actor === 'client') return name || 'Клиент (ИП)';
    if (actor === 'analyst') return name || 'Сотрудник банка';
    return name || 'Автоматическая проверка';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Журнал аудита и переходов"
      description="Полная хронология этапов и решений по кредитному досье"
      maxWidth="lg"
    >
      {/* Вертикальный таймлайн (.timeline из макет.html) */}
      <ul className="list-none p-0 m-0 text-[#141414]">
        {filteredHistory.map((record) => {
          const fromMeta = STATUS_MAP[record.fromStatus] || STATUS_MAP.draft;
          const toMeta = STATUS_MAP[record.toStatus] || STATUS_MAP.draft;

          return (
            <li
              key={record.id}
              className="border-l border-[#e6e8ea] pl-5 pb-6 relative text-[13px] last:pb-0"
            >
              {/* Красная точка таймлайна */}
              <span className="w-[7px] h-[7px] rounded-full bg-[#EF3124] absolute -left-[4px] top-[6px]" />

              <small className="block text-[#686b70] text-[11px] mb-1">
                {formatDateTime(record.timestamp)} • {getActorLabel(record.actor, record.actorName)}
              </small>

              <div className="flex flex-wrap items-center gap-2 my-1">
                <span className="inline-block rounded-[7px] bg-[#fff1ef] text-[#a42b22] px-2 py-0.5 text-[11px] font-bold">
                  {record.transitionCode}
                </span>
                <strong className="font-bold text-[#141414]">
                  {TRANSITION_DESCRIPTIONS[record.transitionCode] || record.transitionCode}
                </strong>
              </div>

              <div className="text-[12px] text-[#686b70] my-1">
                Статус: <span className="text-[#141414] font-medium">{fromMeta.label}</span> →{' '}
                <span className="text-[#141414] font-bold">{toMeta.label}</span>
              </div>

              {record.comment && (
                <p className="my-1.5 p-3 rounded-[10px] bg-[#f5f6f7] text-[#141414] text-[12px] whitespace-pre-wrap">
                  «{record.comment}»
                </p>
              )}

              {record.reasonCode && (
                <span className="text-[11px] font-mono text-[#686b70] block mt-1">
                  Код причины: <strong className="text-[#141414]">{record.reasonCode}</strong>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
};