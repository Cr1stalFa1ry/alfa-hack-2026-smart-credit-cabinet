import { ApplicationStatus, TransitionCode } from '../types/application';

export interface StatusMeta {
  label: string;
  badgeClass: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
  description: string;
}

export const STATUS_MAP: Record<ApplicationStatus, StatusMeta> = {
  draft: {
    label: 'Черновик',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    bgLightClass: 'bg-slate-50 dark:bg-slate-800/40',
    borderClass: 'border-slate-200 dark:border-slate-700',
    textClass: 'text-slate-700 dark:text-slate-300',
    dotClass: 'bg-slate-400',
    description: 'Заявка создана и заполняется заёмщиком',
  },
  checking: {
    label: 'На проверке',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    bgLightClass: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-700 dark:text-blue-300',
    dotClass: 'bg-blue-500 animate-pulse',
    description: 'Система проверяет сведения бизнеса в государственных реестрах',
  },
  waiting_check: {
    label: 'Ожидание сервиса',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    bgLightClass: 'bg-amber-50/40 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-800 dark:text-amber-300',
    dotClass: 'bg-amber-500',
    description: 'Внешний источник временно недоступен (503). Доступен повтор',
  },
  need_info: {
    label: 'Нужны сведения',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    bgLightClass: 'bg-orange-50/40 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800',
    textClass: 'text-orange-800 dark:text-orange-300',
    dotClass: 'bg-orange-500',
    description: 'Банк ожидает от клиента уточняющие данные или документы',
  },
  review: {
    label: 'На рассмотрении',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    bgLightClass: 'bg-purple-50/40 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-800',
    textClass: 'text-purple-700 dark:text-purple-300',
    dotClass: 'bg-purple-500',
    description: 'Заявка на рассмотрении у специалиста банка для детальной оценки',
  },
  offer: {
    label: 'Одобрено (Оферта)',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    bgLightClass: 'bg-emerald-50/40 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
    description: 'Кредит одобрен. Сформированы условия и график платежей',
  },
  declined: {
    label: 'Отказ',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    bgLightClass: 'bg-rose-50/40 dark:bg-rose-950/30',
    borderClass: 'border-rose-200 dark:border-rose-800',
    textClass: 'text-rose-700 dark:text-rose-300',
    dotClass: 'bg-rose-500',
    description: 'По заявке вынесен отказ с прозрачным указанием причины',
  },
  accepted: {
    label: 'Оферта принята',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    bgLightClass: 'bg-teal-50/40 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-800',
    textClass: 'text-teal-700 dark:text-teal-300',
    dotClass: 'bg-teal-500',
    description: 'Клиент согласился с условиями. Ожидается подписание договора',
  },
  signed_sim: {
    label: 'Договор подписан',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    bgLightClass: 'bg-indigo-50/40 dark:bg-indigo-950/30',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    dotClass: 'bg-indigo-500',
    description: 'Договор подписан простой электронной подписью. Распоряжение на выдачу',
  },
  disbursed_sim: {
    label: 'Кредит выдан',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-bold',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    textClass: 'text-emerald-800 dark:text-emerald-200',
    dotClass: 'bg-emerald-600',
    description: 'Кредитные средства успешно зачислены на расчётный счёт предпринимателя',
  },
  closed: {
    label: 'Закрыта',
    badgeClass: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-700',
    bgLightClass: 'bg-gray-50 dark:bg-slate-800/30',
    borderClass: 'border-gray-200 dark:border-slate-700',
    textClass: 'text-gray-600 dark:text-slate-400',
    dotClass: 'bg-gray-400',
    description: 'Заявка отозвана заёмщиком либо закрыта по некредитным причинам',
  },
};

export const TRANSITION_DESCRIPTIONS: Record<string, string> = {
  T00: 'Изменение статуса заявки',
  T01: 'Создание заявки',
  T02: 'Автосохранение черновика',
  T03: 'Подача заявки на рассмотрение',
  T04: 'Запрос дополнительных сведений',
  T05: 'Сервис временно недоступен (503)',
  T06: 'Повторный запуск проверки',
  T07: 'Передача на рассмотрение специалисту банка',
  T08: 'Одобрение условий (автоматически)',
  T09: 'Отказ по стоп-фактору',
  T10: 'Предоставление сведений клиентом',
  T11: 'Запрос документов или сведений специалистом',
  T12: 'Одобрение кредита специалистом банка',
  T13: 'Отказ по заявке специалистом',
  T14: 'Сведения уточнены, повторная проверка',
  T15: 'Повторный запрос сведений',
  T16: 'Закрытие по некредитной причине',
  T17: 'Заявка отозвана клиентом',
  T21: 'Клиент принял предложенные условия',
  T22: 'Договор подписан электронной подписью',
  T23: 'Кредитные средства зачислены на счёт',
};
