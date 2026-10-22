import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../../api/clientApi';
import { egripApi } from '../../api/egripApi';
import { EgripCompany } from '../../types/scoring';
import { BusinessType } from '../../types/application';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { FileUpload } from '../../components/common/FileUpload';
import { EgripCard } from '../../components/application/EgripCard';
import { formatRubles } from '../../utils/formatters';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';

export const NewApplicationWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard steps: 1 = ИНН & Бизнес, 2 = Параметры кредита, 3 = Документы & Проверка
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [inn, setInn] = useState('770123456789');
  const [egripCompany, setEgripCompany] = useState<EgripCompany | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType>('operating');
  const [amount, setAmount] = useState<number>(2500000);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [purpose, setPurpose] = useState('Пополнение оборотных средств и закупка товара');
  const [revenue, setRevenue] = useState<number>(750000);
  const [expenses, setExpenses] = useState<number>(380000);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Check EGRIP on INN
  const handleCheckInn = async () => {
    if (inn.length >= 10) {
      setIsLoading(true);
      try {
        const company = await egripApi.getCompanyByInn(inn);
        setEgripCompany(company);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  // Submit action: creates draft and triggers T03
  const handleSubmit = async (submitImmediately: boolean) => {
    setIsLoading(true);
    try {
      const draft = await clientApi.createDraft({
        inn,
        companyName: egripCompany?.fullName,
        businessType,
        requestedAmount: Number(amount),
        requestedTermMonths: Number(termMonths),
        purpose,
        monthlyRevenue: Number(revenue),
        monthlyExpenses: Number(expenses),
      });

      // Upload files if any
      for (const file of uploadedFiles) {
        await clientApi.uploadDocument(draft.id, file);
      }

      if (submitImmediately) {
        await clientApi.submitApplication(draft.id);
      }

      navigate(`/client/applications/${draft.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/client/dashboard')}
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Оформление кредита для ИП
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Шаг {currentStep} из 3 • Автоматическая проверка ЕГРИП и экспресс-скоринг
          </p>
        </div>
      </div>

      {/* Stepper indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              currentStep >= step ? 'bg-alfa-500' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Entrepreneur details & EGRIP */}
      {currentStep === 1 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Шаг 1. Данные индивидуального предпринимателя
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Укажите ИНН, система мгновенно подтянет регистрационную карточку из реестра ЕГРИП
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="ИНН предпринимателя (12 цифр)"
                placeholder="770123456789"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                maxLength={12}
                helperText="Тестовые ИНН: 770123456789, 500198765432, 780911223344"
              />
            </div>
            <div className="sm:self-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCheckInn}
                isLoading={isLoading}
              >
                Проверить ЕГРИП
              </Button>
            </div>
          </div>

          {/* EGRIP Card preview */}
          {egripCompany && <EgripCard company={egripCompany} />}

          {/* Business Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Стадия бизнеса
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setBusinessType('operating')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  businessType === 'operating'
                    ? 'border-alfa-500 bg-alfa-50/40 dark:bg-alfa-950/30 ring-2 ring-alfa-200 dark:ring-alfa-900'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-bold text-sm text-slate-900 dark:text-white block">Действующий бизнес</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Регистрация более 12 месяцев, есть стабильная выручка
                </span>
              </div>

              <div
                onClick={() => setBusinessType('prelaunch')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  businessType === 'prelaunch'
                    ? 'border-alfa-500 bg-alfa-50/40 dark:bg-alfa-950/30 ring-2 ring-alfa-200 dark:ring-alfa-900'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-bold text-sm text-slate-900 dark:text-white block">Новый бизнес (Prelaunch)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Менее 12 месяцев или запуск нового направления
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Далее к параметрам кредита
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Loan parameters & Financials */}
      {currentStep === 2 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Шаг 2. Параметры кредитования и финансовые показатели
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Укажите желаемую сумму, срок кредита и ориентировочные доходы
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Запрашиваемая сумма (₽)"
                type="number"
                step="50000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                helperText={`Сумма прописью: ${formatRubles(amount)}`}
              />
            </div>

            <div>
              <Select
                label="Срок кредита"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                options={[
                  { value: 12, label: '12 месяцев (1 год)' },
                  { value: 18, label: '18 месяцев (1.5 года)' },
                  { value: 24, label: '24 месяца (2 года)' },
                  { value: 36, label: '36 месяцев (3 года)' },
                  { value: 48, label: '48 месяцев (4 года)' },
                ]}
              />
            </div>
          </div>

          <Input
            label="Цель кредитования"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Например: покупка оборудования, аренда, оборотные средства"
          />

          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Ежемесячные финансовые потоки ИП
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Среднемесячная выручка (₽)"
                type="number"
                step="10000"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
              />
              <Input
                label="Среднемесячные расходы (₽)"
                type="number"
                step="10000"
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
              />
            </div>

            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Расчетный чистый поток:</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {formatRubles(revenue - expenses)} / мес
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setCurrentStep(1)}>
              Назад
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(3)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Далее к документам
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Documents and Submission */}
      {currentStep === 3 && (
        <Card className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Шаг 3. Документы и отправка заявки
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Загрузите выписку по расчетному счету для ускорения автоматического скоринга
            </p>
          </div>

          <FileUpload
            onFileUploaded={handleFileUpload}
            existingDocuments={uploadedFiles.map((f, i) => ({
              id: `temp-${i}`,
              fileName: f.name,
              fileSizeBytes: f.size,
              fileType: 'bank_statement',
              uploadedAt: new Date().toISOString(),
              status: 'uploaded',
            }))}
          />

          {/* Application summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
              Сводка заявки
            </span>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Заёмщик:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {egripCompany?.fullName || `ИП (ИНН ${inn})`}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Запрашиваемый кредит:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatRubles(amount)} на {termMonths} мес.
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Тип бизнеса:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {businessType === 'operating' ? 'Действующий' : 'Prelaunch (новый)'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setCurrentStep(2)}>
              Назад
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial"
                isLoading={isLoading}
                onClick={() => handleSubmit(false)}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Сохранить черновик (T01)
              </Button>

              <Button
                variant="primary"
                className="flex-1 sm:flex-initial"
                isLoading={isLoading}
                onClick={() => handleSubmit(true)}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Отправить в банк (T03)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
