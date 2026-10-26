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

// Извлекаем все взаимодействия (дозапросы банка и ответы клиента) с строго изолированными файлами
export function extractInquiriesHistory(application: CreditApplication): InquiryItem[] {
  if (!application) return [];

  const items: InquiryItem[] = [];
  const allDocs = application.documents || [];

  // Сопоставляем документы строго по упоминанию имени файла в тексте ответа / комментария
  const findMatchingDocuments = (text?: string): UploadedDocument[] => {
    if (!text || !text.trim()) return [];
    const matched: UploadedDocument[] = [];
    const seen = new Set<string>();
    const lowerText = text.toLowerCase();

    allDocs.forEach((doc) => {
      if (seen.has(doc.id)) return;
      if (doc.fileName && lowerText.includes(doc.fileName.toLowerCase())) {
        matched.push(doc);
        seen.add(doc.id);
      }
    });

    return matched;
  };

  // Нормализуем текст запроса для сопоставления
  const normalizePrompt = (str: string): string => {
    return str
      .replace(/^Запрос сведений:\s*/i, '')
      .replace(/^Запрос дополнительных сведений по заявке:\s*/i, '')
      .trim();
  };

  // 1. Проверяем структурированные запросы application.requests
  if (application.requests && application.requests.length > 0) {
    application.requests.forEach((req) => {
      let reqFiles = req.files && req.files.length > 0 ? [...req.files] : [];
      if (reqFiles.length === 0 && req.response) {
        reqFiles = findMatchingDocuments(req.response);
      }

      let cleanPrompt = req.title || '';
      if (req.reason && req.reason.trim() && req.reason.trim() !== req.title.trim()) {
        cleanPrompt = `${req.title}: ${req.reason}`;
      }
      cleanPrompt = normalizePrompt(cleanPrompt);

      items.push({
        id: req.id,
        prompt: cleanPrompt || req.title || 'Запрос сведений',
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
        prompt: normalizePrompt(rec.comment || 'Запрос дополнительных сведений по заявке'),
        promptAt: rec.timestamp,
        actorName: rec.actorName || (rec.actor === 'analyst' ? 'Специалист банка' : 'Автоматическая проверка'),
        isCurrentOpen: false,
        files: [],
      };
    } else if (isClientResponse && currentInquiry) {
      currentInquiry.response = rec.comment || 'Сведения предоставлены клиентом';
      currentInquiry.responseAt = rec.timestamp;

      let respFiles = rec.files && rec.files.length > 0 ? [...rec.files] : [];
      if (respFiles.length === 0 && rec.comment) {
        respFiles = findMatchingDocuments(rec.comment);
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

  // 3. Фолбэк на needInfoPrompt / needInfoResponse (только если список пуст)
  if (items.length === 0 && (application.needInfoPrompt || application.needInfoResponse)) {
    let fallbackFiles: UploadedDocument[] = [];
    if (application.needInfoResponse) {
      fallbackFiles = findMatchingDocuments(application.needInfoResponse);
    }
    if (fallbackFiles.length === 0 && application.needInfoFiles && application.needInfoFiles.length > 0) {
      fallbackFiles = [...application.needInfoFiles];
    }

    items.push({
      id: 'latest-inquiry',
      prompt: normalizePrompt(application.needInfoPrompt || 'Запрос дополнительных сведений'),
      promptAt: application.updatedAt,
      response: application.needInfoResponse,
      responseAt: application.updatedAt,
      actorName: 'Специалист банка',
      isCurrentOpen: application.status === 'need_info' && !application.needInfoResponse,
      files: fallbackFiles,
    });
  }

  // Сортируем все взаимодействия строго хронологически по времени отправки запроса
  items.sort((a, b) => {
    const ta = a.promptAt ? new Date(a.promptAt).getTime() : 0;
    const tb = b.promptAt ? new Date(b.promptAt).getTime() : 0;
    return ta - tb;
  });

  // Дедупликация (объединяем записи, относящиеся к одному и тому же дозапросу)
  const unique: InquiryItem[] = [];
  items.forEach((item) => {
    const existing = unique.find((u) => {
      // 1. Если оба запроса имеют признак текущего открытого дозапроса — это гарантированно один и тот же активный запрос
      if (item.isCurrentOpen && u.isCurrentOpen) return true;

      // 2. Если временные метки отправки практически совпадают (разница менее 10 секунд)
      if (item.promptAt && u.promptAt) {
        const diffMs = Math.abs(new Date(item.promptAt).getTime() - new Date(u.promptAt).getTime());
        if (diffMs <= 10000) return true;
      }

      // 3. Если нормализованные тексты вопросов совпадают или один содержит другой
      const p1 = item.prompt.trim().toLowerCase();
      const p2 = u.prompt.trim().toLowerCase();
      if (p1 === p2) return true;
      if (p1 && p2 && (p1.includes(p2) || p2.includes(p1))) {
        if ((item.isCurrentOpen && u.isCurrentOpen) || (item.response || '') === (u.response || '')) {
          return true;
        }
      }

      return false;
    });

    if (!existing) {
      unique.push({ ...item });
    } else {
      // Объединяем информацию в существующий элемент
      if (!existing.response && item.response) {
        existing.response = item.response;
        existing.responseAt = item.responseAt;
      }
      if (item.isCurrentOpen) {
        existing.isCurrentOpen = true;
      }
      if ((!existing.files || existing.files.length === 0) && item.files && item.files.length > 0) {
        existing.files = item.files;
      }
      // Оставляем более свежее и полное описание
      if (item.promptAt && (!existing.promptAt || new Date(item.promptAt) > new Date(existing.promptAt))) {
        existing.promptAt = item.promptAt;
      }
    }
  });

  // Итоговая хронологическая сортировка (самый последний запрос гарантированно будет последним)
  unique.sort((a, b) => {
    const ta = a.promptAt ? new Date(a.promptAt).getTime() : 0;
    const tb = b.promptAt ? new Date(b.promptAt).getTime() : 0;
    return ta - tb;
  });

  return unique;
}
