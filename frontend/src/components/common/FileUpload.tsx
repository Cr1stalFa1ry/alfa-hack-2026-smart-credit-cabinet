import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  File,
  FileText,
  FileSpreadsheet,
  Image,
  CheckCircle2,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { UploadedDocument } from '../../types/application';

interface FileUploadProps {
  onFileUploaded: (file: File) => Promise<any> | void;
  onDeleteDocument?: (docId: string) => Promise<void> | void;
  existingDocuments?: UploadedDocument[];
  accept?: string;
  maxSizeBytes?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onDeleteDocument,
  existingDocuments = [],
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
  maxSizeBytes = 15 * 1024 * 1024, // 15 MB
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <FileText className="w-4 h-4 text-rose-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      return <Image className="w-4 h-4 text-blue-600" />;
    }
    if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-indigo-600" />;
    }
    return <File className="w-4 h-4 text-slate-500" />;
  };

  const getFileBadgeBg = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50';
    if (['xls', 'xlsx', 'csv'].includes(ext || ''))
      return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50';
    if (['png', 'jpg', 'jpeg'].includes(ext || ''))
      return 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50';
    if (['doc', 'docx'].includes(ext || ''))
      return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50';
    return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 КБ';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const formatDocDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    setSuccessNotice(null);
    if (!files || files.length === 0) return;
    const list = Array.from(files);

    for (const file of list) {
      if (file.size > maxSizeBytes) {
        setError(`Файл «${file.name}» превышает допустимый размер ${Math.round(maxSizeBytes / (1024 * 1024))} МБ`);
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    }

    setIsUploading(true);
    try {
      let uploadedCount = 0;
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setUploadProgressText(
          list.length > 1
            ? `Прикрепление (${i + 1} из ${list.length}): ${file.name}...`
            : `Прикрепление файла: ${file.name}...`
        );
        await onFileUploaded(file);
        uploadedCount++;
      }
      setSuccessNotice(
        uploadedCount > 1
          ? `Успешно прикреплено файлов: ${uploadedCount}`
          : `Документ «${list[0].name}» успешно прикреплен к заявке`
      );
    } catch (err: any) {
      console.error('File upload error:', err);
      const msg = err?.response?.data?.error || err?.message || 'Ошибка при загрузке документа на сервер';
      setError(msg);
    } finally {
      setIsUploading(false);
      setUploadProgressText(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (doc: UploadedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteDocument || deletingDocId) return;
    if (!window.confirm(`Удалить документ «${doc.fileName}» из заявки?`)) return;

    setDeletingDocId(doc.id);
    setError(null);
    try {
      await onDeleteDocument(doc.id);
      setSuccessNotice(`Документ «${doc.fileName}» удален из заявки`);
    } catch (err: any) {
      console.error('File delete error:', err);
      const msg = err?.response?.data?.error || err?.message || 'Ошибка удаления документа';
      setError(msg);
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) inputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-150 relative overflow-hidden ${
          isUploading
            ? 'border-alfa-300 bg-rose-50/40 dark:bg-rose-950/20 cursor-wait'
            : isDragOver
            ? 'border-[#EF3124] bg-rose-50/70 dark:bg-rose-950/40 cursor-copy scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-[#EF3124] dark:hover:border-[#EF3124] bg-slate-50/60 dark:bg-slate-900/40 hover:bg-rose-50/20 dark:hover:bg-slate-900 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          disabled={isUploading}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#EF3124] border border-rose-200 dark:border-rose-900/50">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {uploadProgressText || 'Прикрепляем документ к заявке...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Сохранение в защищенное хранилище банка...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#EF3124] border border-slate-200 dark:border-slate-700">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Нажмите для выбора файлов
              </span>{' '}
              <span className="text-sm text-slate-500 dark:text-slate-400">или перетащите сюда</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              PDF, Excel (XLSX, XLS), Word (DOCX, DOC), сканы или фото (до {Math.round(maxSizeBytes / (1024 * 1024))} МБ)
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EF3124] bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50 shadow-xs mt-1">
              + Выбрать файлы на диске
            </span>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200 font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-800 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success notification */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Uploaded documents list */}
      {existingDocuments.length > 0 ? (
        <div className="space-y-2 mt-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {existingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 text-xs sm:text-sm hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${getFileBadgeBg(
                      doc.fileName
                    )}`}
                  >
                    {getFileIcon(doc.fileName)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      {doc.fileName}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatSize(doc.fileSizeBytes)}</span>
                      {doc.uploadedAt && <span>• {formatDocDate(doc.uploadedAt)}</span>}
                      <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Прикреплен
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={doc.fileName}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Скачать документ"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  {onDeleteDocument && (
                    <button
                      type="button"
                      disabled={deletingDocId === doc.id}
                      onClick={(e) => handleDelete(doc, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Удалить документ из заявки"
                    >
                      {deletingDocId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500">
          К заявке пока не прикреплено ни одного документа
        </div>
      )}
    </div>
  );
};
