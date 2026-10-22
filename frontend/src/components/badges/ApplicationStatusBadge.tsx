import React from 'react';
import { ApplicationStatus } from '../../types/application';
import { STATUS_MAP } from '../../utils/statusHelpers';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  showDot = true,
  size = 'md',
}) => {
  const meta = STATUS_MAP[status] || STATUS_MAP.draft;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${meta.badgeClass} ${sizeClasses[size]}`}
      title={meta.description}
    >
      {showDot && <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />}
      {meta.label}
    </span>
  );
};
