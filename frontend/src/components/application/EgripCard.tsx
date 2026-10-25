import React from 'react';
import { EgripCompany } from '../../types/scoring';
import { formatInn } from '../../utils/formatters';

interface EgripCardProps {
  company: EgripCompany;
}

export const EgripCard: React.FC<EgripCardProps> = ({ company }) => {
  const isActive = company.status === 'ACTIVE';

  return (
    <div className="p-6 border border-[#e6e8ea] rounded-[16px] bg-[#f5f6f7] text-[#141414]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[11px] tracking-[0.12em] uppercase text-[#686b70] font-bold block mb-1">
            Выписка из реестра ФНС (ЕГРИП)
          </span>
          <h3 className="text-[18px] font-bold text-[#141414] m-0">{company.fullName}</h3>
        </div>

        <span
          className={`inline-block rounded-[7px] px-[9px] py-[5px] text-[11px] font-medium shrink-0 ${
            isActive ? 'bg-[#edf7f0] text-[#176b45]' : 'bg-[#fff1ef] text-[#a42b22]'
          }`}
        >
          {isActive ? 'Действующий ИП' : 'Прекратил деятельность'}
        </span>
      </div>

      {/* Сетка фактов (.facts / .fact из макет.html) */}
      <div className="grid grid-cols-2 gap-4 my-4 pt-4 border-t border-[#e6e8ea]">
        <div>
          <small className="block text-[#686b70] text-[11px] mb-1">ИНН</small>
          <strong className="text-[14px] font-medium font-mono">{formatInn(company.inn)}</strong>
        </div>
        <div>
          <small className="block text-[#686b70] text-[11px] mb-1">ОГРНИП</small>
          <strong className="text-[14px] font-medium font-mono">{company.ogrnip}</strong>
        </div>
        <div>
          <small className="block text-[#686b70] text-[11px] mb-1">Дата регистрации</small>
          <strong className="text-[14px] font-medium">{company.registrationDate}</strong>
        </div>
        <div>
          <small className="block text-[#686b70] text-[11px] mb-1">Регион ведения бизнеса</small>
          <strong className="text-[14px] font-medium">{company.region}</strong>
        </div>
        <div className="col-span-2 pt-2 border-t border-[#e6e8ea]">
          <small className="block text-[#686b70] text-[11px] mb-1">Основной вид деятельности (ОКВЭД)</small>
          <strong className="text-[13px] font-medium">
            {company.okved} — {company.okvedName}
          </strong>
        </div>
      </div>
    </div>
  );
};