import React from 'react';
import { EgripCompany } from '../../types/scoring';
import { Card } from '../common/Card';
import { Building2, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { formatInn } from '../../utils/formatters';

interface EgripCardProps {
  company: EgripCompany;
}

export const EgripCard: React.FC<EgripCardProps> = ({ company }) => {
  const isActive = company.status === 'ACTIVE';

  return (
    <Card className="bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{company.fullName}</h4>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">ИНН: {formatInn(company.inn)}</span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isActive
              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          {isActive ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Действующий ИП
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Ликвидирован
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">ОГРНИП</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{company.ogrnip}</span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Дата регистрации</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {company.registrationDate}
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Регион</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {company.region}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Основной ОКВЭД:</span> {company.okved} — {company.okvedName}
      </div>
    </Card>
  );
};
