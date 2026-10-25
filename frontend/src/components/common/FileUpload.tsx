import React, { useRef, useState } from 'react';
import { UploadCloud, File, CheckCircle, Download } from 'lucide-react';
import { UploadedDocument } from '../../types/application';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
  existingDocuments?: UploadedDocument[];
  accept?: string;
  maxSizeBytes?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  existingDocuments = [],
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg',
  maxSizeBytes = 15 * 1024 * 1024, // 15 MB
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > maxSizeBytes) {
      setError(`Размер файла превышает лимит ${Math.round(maxSizeBytes / (1024 * 1024))} МБ`);
      return;
    }

    onFileUploaded(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 ${
          isDragOver
            ? 'border-alfa-500 bg-alfa-50/60 dark:bg-alfa-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-alfa-500 border border-slate-100 dark:border-slate-700">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Нажмите для выбора файла
            </span>{' '}
            <span className="text-sm text-slate-500 dark:text-slate-400">или перетащите сюда</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Выписки по расчетному счету, налоговые декларации (PDF, Excel, до 15 МБ)
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

      {/* Uploaded documents list */}
      {existingDocuments.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Прикрепленные документы ({existingDocuments.length})
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {existingDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 truncate">
                  <File className="w-4 h-4 text-alfa-500 flex-shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{doc.fileName}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">
                    {(doc.fileSizeBytes / 1024 / 1024).toFixed(1)} МБ
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {doc.status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Проверен
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Загружен</span>
                  )}
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.fileName}
                      className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Скачать документ"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
