import { EgripCompany } from '../types/scoring';
import { MOCK_EGRIP_COMPANIES } from './mockData';
import { apiClient } from './apiClient';

export const egripApi = {
  getCompanyByInn: async (inn: string): Promise<EgripCompany | null> => {
    const cleanInn = inn.trim();
    if (!cleanInn) return null;

    // Try live API first if available (SmartKabinet.Intergrations)
    try {
      const res = await apiClient.get<EgripCompany>(`/integrations/egrip/${cleanInn}`, { timeout: 3500 });
      if (res.data && res.data.fullName) return res.data;
    } catch {
      // Fallback to static mock only if backend is unreachable or returns 404
    }

    // Check predefined mock companies with real names
    if (MOCK_EGRIP_COMPANIES[cleanInn]) {
      return MOCK_EGRIP_COMPANIES[cleanInn];
    }

    // Default seed mapping for common test INNs
    if (cleanInn === '500100000011') {
      return {
        inn: cleanInn,
        ogrnip: '320508100111111',
        fullName: 'ИП Иванов Иван Иванович',
        status: 'ACTIVE',
        registrationDate: '2021-02-10',
        okved: '62.01',
        okvedName: 'Разработка компьютерного программного обеспечения',
        region: 'Московская область',
      };
    }

    if (cleanInn === '500100000022') {
      return {
        inn: cleanInn,
        ogrnip: '320508100222222',
        fullName: 'ИП Сидорова Анна Михайловна',
        status: 'ACTIVE',
        registrationDate: '2022-06-15',
        okved: '47.71',
        okvedName: 'Торговля розничная одеждой',
        region: 'Московская область',
      };
    }

    return null;
  },
};
