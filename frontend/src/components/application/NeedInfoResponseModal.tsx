import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FileUpload } from '../common/FileUpload';
import { UploadedDocument } from '../../types/application';

interface NeedInfoResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  onSubmit: (response: string, attachedFiles?: UploadedDocument[]) => Promise<void>;
  onFileUpload: (file: File) => Promise<UploadedDocument | undefined>;
  uploadedDocuments?: UploadedDocument[];
}

export const NeedInfoResponseModal: React.FC<NeedInfoResponseModalProps> = ({
  isOpen,
  onClose,
  promptText,
  onSubmit,
  onFileUpload,
}) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedDocument[]>([]);

  // Сброс полей при закрытии или открытии
  useEffect(() => {
    if (!isOpen) {
      setResponse('');
      setAttachedFiles([]);
    }
  }, [isOpen]);

  const handleUploadWrapper = async (file: File) => {
    const doc = await onFileUpload(file);
    if (doc) {
      setAttachedFiles((prev) => {
        if (prev.some((d) => d.id === doc.id || d.fileName === doc.fileName)) return prev;
        return [...prev, doc];
      });
    }
    return doc;
  };

  const handleDeleteAttached = (docId: string) => {
    setAttachedFiles((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(response.trim(), attachedFiles);
      setResponse('');
      setAttachedFiles([]);
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
      description="Предоставьте пояснения или приложите документы для продолжения рассмотрения заявки (T10)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-[#141414]">
        {/* Блок предупреждения (.message.warn из макет.html) */}
        <div className="p-4 rounded-[12px] bg-[#fff7e8] text-[#714817] text-[13px] leading-[1.6]">
          <strong className="block mb-1">Запрос специалиста банка:</strong>
          {promptText}
        </div>

        <div>
          <label className="block font-bold text-[14px] mb-2">Ваш комментарий / пояснение</label>
          <textarea
            className="w-full px-4 py-3.5 border border-[#D1D5D8] rounded-[11px] bg-white text-[#141414] text-[14px] focus:outline-2 focus:outline-[#EF3124]"
            placeholder="Опишите подробности или причину изменения финансовых показателей..."
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-bold text-[14px] mb-2 flex items-center justify-between">
            <span>
              Подтверждающие документы <span className="text-[11px] font-normal text-[#686b70] ml-1">необязательно</span>
            </span>
            {attachedFiles.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Прикреплено файлов: {attachedFiles.length}
              </span>
            )}
          </label>
          <FileUpload
            onFileUploaded={handleUploadWrapper}
            onDeleteDocument={handleDeleteAttached}
            existingDocuments={attachedFiles}
          />
        </div>

        <div className="pt-4 border-t border-[#e6e8ea] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] px-[18px] py-[12px] font-bold text-[14px] bg-[#f5f6f7] text-[#141414] border border-[#e6e8ea] cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[12px] px-[21px] py-[12px] font-bold text-[14px] bg-[#EF3124] hover:bg-[#cd2017] text-white cursor-pointer disabled:opacity-45"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить ответ в банк (T10)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
