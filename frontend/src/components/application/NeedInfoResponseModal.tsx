import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Textarea } from '../common/Textarea';
import { FileUpload } from '../common/FileUpload';
import { UploadedDocument } from '../../types/application';

interface NeedInfoResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  onSubmit: (response: string) => Promise<void>;
  onFileUpload: (file: File) => void;
  uploadedDocuments: UploadedDocument[];
}

export const NeedInfoResponseModal: React.FC<NeedInfoResponseModalProps> = ({
  isOpen,
  onClose,
  promptText,
  onSubmit,
  onFileUpload,
  uploadedDocuments,
}) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(response.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ответ на запрос банка"
      description="Предоставьте пояснения или прикрепите подтверждающие документы для продолжения проверки (переход T10)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <span className="font-bold block mb-1">Вопрос аналитика / системы:</span>
          {promptText}
        </div>

        <Textarea
          label="Ваш комментарий / пояснение"
          placeholder="Опишите подробности или причину изменения финансовых показателей..."
          rows={4}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Прикрепить документы (по желанию)
          </label>
          <FileUpload
            onFileUploaded={onFileUpload}
            existingDocuments={uploadedDocuments}
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Отправить ответ в банк (T10)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
