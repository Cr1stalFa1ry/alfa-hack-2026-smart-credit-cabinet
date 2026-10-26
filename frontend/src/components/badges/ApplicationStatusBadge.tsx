import React from 'react';
import { ApplicationStatus } from '../../types/application';
import { STATUS_MAP } from '../../utils/statusHelpers';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
  customLabel?: string;
  clientName?: string;
  isAnalystView?: boolean;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  showDot = true,
  size = 'md',
  customLabel,
  clientName,
  isAnalystView = false,
}) => {
  const meta = STATUS_MAP[status] || STATUS_MAP.draft;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3 py-1 gap-2',
  };

  let label = customLabel || meta.label;
  if (!customLabel && isAnalystView && status === 'need_info') {
    label = 'Ожидание ответа';
  }

  const tooltip =
    isAnalystView && status === 'need_info'
      ? 'Банк ожидает ответ на запрос сведений от клиента'
      : meta.description;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${meta.badgeClass} ${sizeClasses[size]}`}
      title={customLabel || tooltip}
    >
      {showDot && <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />}
      {label}
    </span>
  );
};
