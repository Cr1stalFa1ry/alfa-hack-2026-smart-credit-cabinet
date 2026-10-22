import { apiClient } from './apiClient';
import { CreditApplication, CreditOffer } from '../types/application';
import { mockStore } from './mockStore';
import { mapBackendApplication } from './clientApi';

function isDemoActive(): boolean {
  return localStorage.getItem('smart_kabinet_demo_mode') === 'true';
}

export const analystApi = {
  getReviewQueue: async (): Promise<CreditApplication[]> => {
    if (isDemoActive()) {
      return mockStore.getAll();
    }

    try {
      const res = await apiClient.get<any[]>('/employee/applications/queue', { timeout: 2500 });
      if (Array.isArray(res.data)) {
        return res.data.map(mapBackendApplication);
      }
      return [];
    } catch {
      // In real analyst mode, if queue is empty or offline, return empty list
      return [];
    }
  },

  getApplicationDetails: async (id: string): Promise<CreditApplication> => {
    if (isDemoActive()) {
      const app = mockStore.getById(id);
      if (!app) throw new Error('Заявка не найдена');
      return app;
    }

    try {
      const res = await apiClient.get<any>(`/employee/applications/${id}`, { timeout: 2500 });
      if (res.data) {
        return mapBackendApplication(res.data);
      }
    } catch {
      // ignore
    }

    const fallbackApp = mockStore.getById(id);
    if (fallbackApp) return fallbackApp;

    throw new Error('Заявка не найдена');
  },

  // T11: Запрос сведений у клиента (review -> need_info)
  requestNeedInfo: async (id: string, prompt: string): Promise<CreditApplication> => {
    if (!isDemoActive()) {
      try {
        const res = await apiClient.post<any>(
          `/employee/applications/${id}/request-info`,
          { comment: prompt },
          { timeout: 2500 }
        );
        return mapBackendApplication(res.data);
      } catch {
        // fallback
      }
    }

    return mockStore.transition(
      id,
      'T11',
      'need_info',
      'analyst',
      'Аналитик Банка',
      prompt,
      undefined,
      { needInfoPrompt: prompt }
    );
  },

  // T12: Решение аналитика об одобрении (review -> offer)
  approveOffer: async (
    id: string,
    params: {
      approvedAmount: number;
      approvedTermMonths: number;
      annualInterestRate: number;
      comment?: string;
    }
  ): Promise<CreditApplication> => {
    if (!isDemoActive()) {
      try {
        const res = await apiClient.post<any>(
          `/employee/applications/${id}/approve`,
          {
            approvedAmount: params.approvedAmount,
            termMonths: params.approvedTermMonths,
            annualRatePercent: params.annualInterestRate,
            comment: params.comment,
          },
          { timeout: 2500 }
        );
        return mapBackendApplication(res.data);
      } catch {
        // fallback
      }
    }

    const monthlyPayment = Math.round(
      (params.approvedAmount * (1 + (params.annualInterestRate / 100) * (params.approvedTermMonths / 12))) /
        params.approvedTermMonths
    );
    const totalRepayment = monthlyPayment * params.approvedTermMonths;

    const offer: CreditOffer = {
      approvedAmount: params.approvedAmount,
      approvedTermMonths: params.approvedTermMonths,
      annualInterestRate: params.annualInterestRate,
      monthlyPayment,
      totalRepayment,
      expirationDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      alternativeTerms: {
        additionalMonths: 6,
        newTermMonths: params.approvedTermMonths + 6,
        newMonthlyPayment: Math.round(
          (params.approvedAmount * (1 + (params.annualInterestRate / 100) * ((params.approvedTermMonths + 6) / 12))) /
            (params.approvedTermMonths + 6)
        ),
        note: `Опция продления на 6 мес снижает ежемесячную нагрузку`,
      },
    };

    return mockStore.transition(
      id,
      'T12',
      'offer',
      'analyst',
      'Аналитик Банка',
      params.comment || `Одобрено андеррайтером: ${params.approvedAmount.toLocaleString('ru-RU')} ₽ под ${params.annualInterestRate}%`,
      undefined,
      { offer }
    );
  },

  // T13: Отказ аналитика (review -> declined)
  declineApplication: async (id: string, reasonCode: string, comment: string): Promise<CreditApplication> => {
    if (!isDemoActive()) {
      try {
        const res = await apiClient.post<any>(
          `/employee/applications/${id}/decline`,
          { reasonCode, comment },
          { timeout: 2500 }
        );
        return mapBackendApplication(res.data);
      } catch {
        // fallback
      }
    }

    return mockStore.transition(
      id,
      'T13',
      'declined',
      'analyst',
      'Аналитик Банка',
      comment,
      reasonCode,
      { declineReason: comment }
    );
  },

  // T14: Уточнены факты, вернуть на проверку (review -> checking)
  returnToChecking: async (id: string, comment?: string): Promise<CreditApplication> => {
    if (!isDemoActive()) {
      try {
        const res = await apiClient.post<any>(
          `/employee/applications/${id}/recheck`,
          { comment },
          { timeout: 2500 }
        );
        return mapBackendApplication(res.data);
      } catch {
        // fallback
      }
    }

    return mockStore.transition(
      id,
      'T14',
      'checking',
      'analyst',
      'Аналитик Банка',
      comment || 'Факты уточнены аналитиком, заявка отправлена на повторный скоринг'
    );
  },

  // T16: Некредитное препятствие (review -> closed)
  closeNonCredit: async (id: string, reasonCode: string, comment: string): Promise<CreditApplication> => {
    if (!isDemoActive()) {
      try {
        const res = await apiClient.post<any>(
          `/employee/applications/${id}/close`,
          { reasonCode, comment },
          { timeout: 2500 }
        );
        return mapBackendApplication(res.data);
      } catch {
        // fallback
      }
    }

    return mockStore.transition(
      id,
      'T16',
      'closed',
      'analyst',
      'Аналитик Банка',
      comment,
      reasonCode
    );
  },
};
