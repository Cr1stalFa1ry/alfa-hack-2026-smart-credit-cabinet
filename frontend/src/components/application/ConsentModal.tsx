import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShieldCheck, FileText, Building2, Check, Download, AlertTriangle } from 'lucide-react';

export type ConsentType = 'pdn' | 'bki' | 'leasing';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ConsentType;
  onAccept?: () => void;
  isAccepted?: boolean;
  partnerName?: string;
  applicantName?: string;
  inn?: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  type,
  onAccept,
  isAccepted = false,
  partnerName = 'ООО «Альфа-Лизинг» (ИНН 7707330770)',
  applicantName = 'Индивидуальный предприниматель',
  inn = 'не указан',
}) => {
  const getModalConfig = () => {
    switch (type) {
      case 'pdn':
        return {
          title: 'Согласие на обработку персональных данных',
          subtitle: 'Для проверки сведений, идентификации и рассмотрения кредитной заявки',
          badge: 'Персональные данные',
          icon: ShieldCheck,
          accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
        };
      case 'bki':
        return {
          title: 'Согласие на запрос кредитной истории',
          subtitle: 'Для оценки долговой нагрузки и расчёта кредитного лимита',
          badge: 'Кредитная история',
          icon: FileText,
          accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
        };
      case 'leasing':
        return {
          title: 'Согласие на передачу сведений лизинговому партнёру',
          subtitle: `Для подготовки коммерческого предложения и графика в ${partnerName}`,
          badge: 'Альфа-Лизинг',
          icon: Building2,
          accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900',
        };
    }
  };

  const config = getModalConfig();
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      description={config.subtitle}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
        {/* Meta badge */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${config.accentColor}`}>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-bold text-xs">
              Субъект согласия: {applicantName} (ИНН: {inn})
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/70 dark:bg-slate-900/70 shadow-xs">
            {config.badge}
          </span>
        </div>

        {/* Scrollable Legal Text Container */}
        <div className="max-h-80 overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4 leading-relaxed font-sans select-text">
          {type === 'pdn' && (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  1. Оператор персональных данных
                </h4>
                <p>
                  Акционерное общество «АЛЬФА-БАНК» (АО «АЛЬФА-БАНК»), генеральная лицензия Банка России № 1326,
                  ОГРН 1027700067328, ИНН 7728168971, место нахождения: 107078, г. Москва, ул. Каланчевская, д. 27.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  2. Цели обработки персональных данных
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Рассмотрение заявления/анкеты на предоставление кредитного продукта или кредитной линии для субъектов МСП и ИП.</li>
                  <li>Оценка платежеспособности, финансового положения и расчет кредитного рейтинга заёмщика.</li>
                  <li>Идентификация субъекта в соответствии с требованиями Федерального закона от 07.08.2001 № 115-ФЗ.</li>
                  <li>Заключение, исполнение и обслуживание договоров банковского счета и кредитных соглашений.</li>
                  <li>Информирование о статусе рассмотрения кредитной заявки и сформированных индивидуальных условиях.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  3. Перечень обрабатываемых персональных данных
                </h4>
                <p>
                  Фамилия, имя, отчество; паспортные данные (серия, номер, дата выдачи, код подразделения); дата и место рождения;
                  ИНН; ОГРНИП; адрес регистрации и фактического ведения бизнеса; контактные телефоны и адреса электронной почты;
                  сведения о доходах, выручке, расходах, налоговом режиме, оборотах по банковским счетам, выписках и существующих обязательствах.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  4. Перечень действий с персональными данными
                </h4>
                <p>
                  Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование,
                  передача (предоставление, доступ) в случаях, прямо установленных законодательством РФ, обезличивание,
                  блокирование, удаление, уничтожение персональных данных, как с использованием средств автоматизации, так и без таковых.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  5. Срок действия и порядок отзыва
                </h4>
                <p>
                  Настоящее согласие вступает в силу с момента подтверждения в электронном виде и действует в течение срока рассмотрения
                  заявки, а при заключении договора кредитования — в течение всего срока действия договора плюс 5 (пять) лет с момента
                  полного исполнения обязательств. Согласие может быть отозвано путем направления письменного заявления в подразделение Банка.
                </p>
              </div>
            </>
          )}

          {type === 'bki' && (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  1. Предмет согласия на запрос в БКИ
                </h4>
                <p>
                  Я, субъект кредитной истории, в соответствии со статьей 6 Федерального закона от 30.12.2004 № 218-ФЗ «О кредитных историях»,
                  настоящим выражаю свое полное и безоговорочное согласие АО «АЛЬФА-БАНК» (далее — Пользователь кредитной истории)
                  на получение информации обо мне из любых квалифицированных Бюро кредитных историй (включая, но не ограничиваясь:
                  АО «НБКИ», АО «ОКБ», АО «Скоринг Бюро»).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  2. Состав запрашиваемой информации
                </h4>
                <p>
                  Кредитный отчет в полном объеме, включая титульную, основную, закрытую и информационную части кредитной истории,
                  сведения о действующих и закрытых кредитных договорах, графиках платежей, наличии или отсутствии просроченной
                  задолженности, длительности просрочек, фактах судебных взысканий и исполнительных производств.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  3. Цели и условия запроса
                </h4>
                <p>
                  Запрос кредитного отчета осуществляется исключительно в целях комплексной оценки кредитоспособности заёмщика,
                  расчета показателя долговой нагрузки (ПДН / DSCR), принятия решения о выдаче кредита/оферты, а также мониторинга
                  финансовой устойчивости в период действия кредитного соглашения.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Срок действия согласия на БКИ
                </div>
                <p className="text-[11px] leading-relaxed">
                  В соответствии с ч. 9 ст. 6 Федерального закона № 218-ФЗ согласие действует в течение <strong>6 (шести) месяцев</strong> со дня его
                  оформления. Если по результатам скоринга между Банком и заёмщиком заключается кредитный договор, согласие сохраняет силу
                  в течение <strong>всего срока действия кредитного обязательства</strong>.
                </p>
              </div>
            </>
          )}

          {type === 'leasing' && (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  1. Стороны и конкретный партнёр-получатель
                </h4>
                <p>
                  Я подтверждаю передачу сведений моей заявки от АО «АЛЬФА-БАНК» в адрес конкретной лизинговой организации:
                  <strong className="text-slate-900 dark:text-white block mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    {partnerName}
                  </strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  2. Состав передаваемых сведений
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Анкетные данные индивидуального предпринимателя (ФИО, ИНН, ОГРНИП, контакты).</li>
                  <li>Параметры запрашиваемого оборудования (наименование, поставщик, спецификация, стоимость, аванс).</li>
                  <li>Финансовые метрики (выручка, расходы, предоставленные банковские выписки).</li>
                  <li>Предварительные результаты скоринга сделки для формирования лизинговой программы.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  3. Цель передачи данных третьей стороне
                </h4>
                <p>
                  Целью передачи является расчет графика лизинговых платежей, подготовка спецификации и коммерческого предложения,
                  согласование условий поставки с поставщиком оборудования, а также заключение прямого трёхстороннего или двустороннего
                  договора финансовой аренды (лизинга).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  4. Обязательства партнёра по защите данных
                </h4>
                <p>
                  Лизинговый партнёр ({partnerName}) обязуется обеспечить конфиденциальность и безопасность полученных персональных данных
                  в соответствии со ст. 19 Федерального закона № 152-ФЗ и не вправе передавать сведения лицам, не участвующим в исполнении лизинговой сделки.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer actions inside modal */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Документ заверен простой электронной подписью (ПЭП) в ИС Банка
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
            {onAccept && !isAccepted && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Подтвердить и принять
              </Button>
            )}
            {isAccepted && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Согласие подтверждено
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
