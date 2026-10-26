import { CreditApplication, UploadedDocument } from '../types/application';

export interface InquiryItem {
  id: string;
  prompt: string;
  promptAt?: string;
  response?: string;
  responseAt?: string;
  actorName?: string;
  isCurrentOpen?: boolean;
  files?: UploadedDocument[];
}

// Извлекаем все взаимодействия (дозапросы банка и ответы клиента) с прикрепленными файлами
export function extractInquiriesHistory(application: CreditApplication): InquiryItem[] {
  if (!application) return [];

  const items: InquiryItem[] = [];
  const allDocs = application.documents || [];

  const findMatchingDocuments = (text?: string, timeIso?: string): UploadedDocument[] => {
    if (!text && !timeIso) return [];
    const matched: UploadedDocument[] = [];
    const seen = new Set<string>();

    allDocs.forEach((doc) => {
      if (seen.has(doc.id)) return;
      // Match by exact file name inside text
      if (text && doc.fileName && text.includes(doc.fileName)) {
        matched.push(doc);
        seen.add(doc.id);
        return;
      }
      // Match by upload time within 15 minutes of response
      if (timeIso && doc.uploadedAt) {
        const diffMs = Math.abs(new Date(doc.uploadedAt).getTime() - new Date(timeIso).getTime());
        if (diffMs <= 15 * 60 * 1000) {
          if (text && (text.includes('файл') || text.includes('документ') || text.includes('Прикреплено') || text.includes('T10'))) {
            matched.push(doc);
            seen.add(doc.id);
          }
        }
      }
    });

    return matched;
  };

  // 1. Проверяем структурированные запросы application.requests
  if (application.requests && application.requests.length > 0) {
    application.requests.forEach((req) => {
      let reqFiles = req.files ? [...req.files] : [];
      if (reqFiles.length === 0 && req.response) {
        reqFiles = findMatchingDocuments(req.response, req.respondedAt);
      }
      if (reqFiles.length === 0 && application.needInfoFiles && application.needInfoFiles.length > 0) {
        if (req.response === application.needInfoResponse || req.status === 'responded') {
          reqFiles = [...application.needInfoFiles];
        }
      }

      items.push({
        id: req.id,
        prompt: req.reason ? `${req.title}: ${req.reason}` : req.title,
        promptAt: req.createdAt,
        response: req.response,
        responseAt: req.respondedAt,
        actorName: 'Специалист банка',
        isCurrentOpen: req.status === 'open',
        files: reqFiles,
      });
    });
  }

  // 2. Извлекаем историю сообщений из журнала переходов (TransitionHistory)
  const allHistory = application.history || [];
  let currentInquiry: InquiryItem | null = null;

  for (let idx = 0; idx < allHistory.length; idx++) {
    const rec = allHistory[idx];
    const isBankPrompt =
      rec.transitionCode === 'T11' ||
      rec.transitionCode === 'T04' ||
      rec.transitionCode === 'T15' ||
      rec.toStatus === 'need_info';

    const isClientResponse =
      rec.transitionCode === 'T10' ||
      (rec.actor === 'client' &&
        (rec.fromStatus === 'need_info' ||
          rec.comment?.includes('T10') ||
          rec.comment?.includes('предоставил') ||
          rec.comment?.includes('Ответ клиента')));

    if (isBankPrompt) {
      if (currentInquiry && currentInquiry.prompt) {
        items.push(currentInquiry);
      }
      currentInquiry = {
        id: rec.id || `prompt-${idx}`,
        prompt: rec.comment || 'Запрос дополнительных сведений по заявке',
        promptAt: rec.timestamp,
        actorName: rec.actorName || (rec.actor === 'analyst' ? 'Специалист банка' : 'Автоматическая проверка'),
        isCurrentOpen: false,
        files: [],
      };
    } else if (isClientResponse && currentInquiry) {
      currentInquiry.response = rec.comment || 'Сведения предоставлены клиентом';
      currentInquiry.responseAt = rec.timestamp;

      let respFiles = findMatchingDocuments(rec.comment, rec.timestamp);
      if (respFiles.length === 0 && application.needInfoFiles && application.needInfoFiles.length > 0) {
        respFiles = [...application.needInfoFiles];
      }
      currentInquiry.files = respFiles;

      items.push(currentInquiry);
      currentInquiry = null;
    }
  }

  if (currentInquiry && (currentInquiry as InquiryItem).prompt) {
    const openInq = currentInquiry as InquiryItem;
    openInq.isCurrentOpen = application.status === 'need_info';
    items.push(openInq);
  }

  // 3. Фолбэк на needInfoPrompt / needInfoResponse
  if (items.length === 0 && (application.needInfoPrompt || application.needInfoResponse)) {
    let fallbackFiles = application.needInfoFiles ? [...application.needInfoFiles] : [];
    if (fallbackFiles.length === 0) {
      fallbackFiles = findMatchingDocuments(application.needInfoResponse, application.updatedAt);
    }
    items.push({
      id: 'latest-inquiry',
      prompt: application.needInfoPrompt || 'Запрос дополнительных сведений',
      promptAt: application.updatedAt,
      response: application.needInfoResponse,
      responseAt: application.updatedAt,
      actorName: 'Специалист банка',
      isCurrentOpen: application.status === 'need_info' && !application.needInfoResponse,
      files: fallbackFiles,
    });
  }

  // Дедупликация
  const unique: InquiryItem[] = [];
  const seen = new Set<string>();
  items.forEach((item) => {
    const key = `${item.prompt.trim()}::${(item.response || '').trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    } else {
      const existing = unique.find((u) => `${u.prompt.trim()}::${(u.response || '').trim()}` === key);
      if (existing && (!existing.files || existing.files.length === 0) && item.files && item.files.length > 0) {
        existing.files = item.files;
      }
    }
  });

  return unique;
}
