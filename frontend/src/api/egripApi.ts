import { apiClient } from './apiClient';
import { EgripCompany } from '../types/scoring';

export const egripApi = {
  getCompanyByInn: async (inn: string): Promise<EgripCompany | null> => {
    const cleanInn = inn.trim();
    if (!cleanInn) return null;

    try {
      const res = await apiClient.get<any>(`/integrations/egrip/${cleanInn}`, { timeout: 4000 });
      if (res.data) {
        const item = res.data.value || res.data;
        return {
          inn: item.inn || cleanInn,
          ogrnip: item.ogrnip || item.ogrn || '',
          fullName: item.fullName || item.name || `ИП (ИНН ${cleanInn})`,
          status: item.status || 'ACTIVE',
          registrationDate: item.registrationDate || '',
          okved: item.okved || item.okvedMain || '',
          okvedName: item.okvedName || '',
          region: item.region || item.regionName || '',
        };
      }
    } catch {
      // Backend integration fallback
    }

    try {
      const res = await apiClient.get<any>(`/client/companies/lookup`, { params: { inn: cleanInn }, timeout: 4000 });
      if (res.data) {
        const item = res.data.value || res.data;
        return {
          inn: item.inn || cleanInn,
          ogrnip: item.ogrnip || item.ogrn || '',
          fullName: item.fullName || item.name || `ИП (ИНН ${cleanInn})`,
          status: item.status || 'ACTIVE',
          registrationDate: item.registrationDate || '',
          okved: item.okved || '',
          okvedName: item.okvedName || '',
          region: item.region || '',
        };
      }
    } catch {
      // Ignore
    }

    return null;
  },
};
