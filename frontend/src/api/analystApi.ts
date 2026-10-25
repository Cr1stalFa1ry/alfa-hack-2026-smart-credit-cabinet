import { apiClient } from './apiClient';
import { CreditApplication, ClientRequestItem } from '../types/application';
import { mapBackendApplication } from './clientApi';
import { applicationStore } from '../utils/applicationStore';

export const analystApi = {
  getReviewQueue: async (): Promise<CreditApplication[]> => {
    try {
      const res = await apiClient.get<any>('/employee/applications/queue', { timeout: 4000 });
      const data = (res.data as any)?.value || res.data;
      if (Array.isArray(data)) {
        const mapped = data
          .map(mapBackendApplication)
          .filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO'));
        applicationStore.syncApps(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Backend employee queue unavailable, using local store:', err);
      return applicationStore.getAll().filter((a) => !a.id.startsWith('DEMO-') && !a.id.includes('DEMO'));
    }
    return [];
  },

  getApplicationDetails: async (id: string): Promise<CreditApplication> => {
    try {
      const res = await apiClient.get<any>(`/employee/applications/${id}`, { timeout: 4000 });
      const data = res.data?.value || res.data;
      if (data) {
        const mapped = mapBackendApplication(data);
        applicationStore.saveApp(mapped);
        return mapped;
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        applicationStore.removeApp(id);
        throw new Error('Заявка не найдена');
      }
      console.warn(`Backend application ${id} fetch error, fallback to local store:`, err);
    }
    const local = applicationStore.getById(id);
    if (local) return local;
    throw new Error('Заявка не найдена');
  },

  // T11: Запрос сведений у клиента (review -> need_info)
  requestNeedInfo: async (
    id: string,
    prompt: string,
    extra?: {
      title?: string;
      reason?: string;
      documentType?: string;
      period?: string;
      documentPurpose?: string;
    }
  ): Promise<CreditApplication> => {
    try {
      await apiClient.post<any>(
        `/employee/applications/${id}/request-info`,
        {
          comment: prompt,
          reasonCode: extra?.documentPurpose || 'NEED_INFO',
        },
        { timeout: 5000 }
      );
    } catch (err) {
      console.warn('Backend request-info error (handled offline):', err);
    }

    applicationStore.addClientRequest(id, {
      title: extra?.title || prompt,
      reason: extra?.reason || prompt,
      documentType: extra?.documentType || '',
      period: extra?.period || '',
      documentPurpose: extra?.documentPurpose || 'general',
    });

    return applicationStore.getById(id)!;
  },

  // T12: Решение аналитика об одобрении (review -> offer)
  approveOffer: async (
    id: string,
    params: {
      approvedAmount: number;
      approvedTermMonths: number;
      annualInterestRate: number;
      comment?: string;
      monthlyPayment?: number;
    }
  ): Promise<CreditApplication> => {
    try {
      await apiClient.post<any>(
        `/employee/applications/${id}/approve`,
        {
          approvedAmount: params.approvedAmount,
          termMonths: params.approvedTermMonths,
          annualRatePercent: params.annualInterestRate,
          comment: params.comment,
        },
        { timeout: 5000 }
      );
    } catch (err) {
      console.warn('Backend approve error (handled offline):', err);
    }

    applicationStore.setStatus(id, 'approved', params.comment || 'Одобрено специалистом', {
      amount: params.approvedAmount,
      term: params.approvedTermMonths,
      rate: params.annualInterestRate,
      payment: params.monthlyPayment || Math.round(params.approvedAmount / params.approvedTermMonths),
      description: params.comment || 'Условия согласованы',
    });

    return applicationStore.getById(id)!;
  },

  // T13: Отказ аналитика (review -> declined)
  declineApplication: async (id: string, reasonCode: string, comment: string): Promise<CreditApplication> => {
    try {
      await apiClient.post<any>(
        `/employee/applications/${id}/decline`,
        { reasonCode, comment },
        { timeout: 5000 }
      );
    } catch (err) {
      console.warn('Backend decline error (handled offline):', err);
    }

    applicationStore.setStatus(id, 'declined', comment);
    return applicationStore.getById(id)!;
  },

  // T14: Уточнены факты, вернуть на проверку (review -> checking)
  returnToChecking: async (id: string, comment?: string): Promise<CreditApplication> => {
    try {
      await apiClient.post<any>(
        `/employee/applications/${id}/recheck`,
        { comment },
        { timeout: 5000 }
      );
    } catch (err) {
      console.warn('Backend recheck error (handled offline):', err);
    }

    applicationStore.setStatus(id, 'checking', comment || 'Возврат на проверку');
    return applicationStore.getById(id)!;
  },

  // T16: Некредитное препятствие (review -> closed)
  closeNonCredit: async (id: string, reasonCode: string, comment: string): Promise<CreditApplication> => {
    try {
      await apiClient.post<any>(
        `/employee/applications/${id}/close`,
        { reasonCode, comment },
        { timeout: 5000 }
      );
    } catch (err) {
      console.warn('Backend close error (handled offline):', err);
    }

    applicationStore.setStatus(id, 'closed', comment);
    return applicationStore.getById(id)!;
  },
};

