export interface Supplier {
  inn: string;
  ogrn: string;
  name: string;
  registration_date: string;
  status: string;
  address: string;
  mass_address: string;
  phone: string;
  email: string;
  director_inn: string;
}

export const BANK_SUPPLIERS: Supplier[] = [
  { inn: "9990927815", ogrn: "1147750944870", name: "ООО «Техно-Сервис 815»", registration_date: "2014-09-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 29", mass_address: "нет", phone: "+7 495 396-13-38", email: "sales7815@example.org", director_inn: "" },
  { inn: "9901477331", ogrn: "1097768949419", name: "ООО «Техно-Сервис 331»", registration_date: "2009-10-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 89", mass_address: "нет", phone: "+7 495 410-98-91", email: "sales7331@example.org", director_inn: "" },
  { inn: "9967955733", ogrn: "1147709872174", name: "ООО «Индустрия-Маркет 733»", registration_date: "2014-10-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 44", mass_address: "нет", phone: "+7 495 961-46-89", email: "sales5733@example.org", director_inn: "" },
  { inn: "9985733934", ogrn: "1107736238993", name: "ООО «Техно-Снаб 934»", registration_date: "2010-02-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 41", mass_address: "нет", phone: "+7 495 210-90-47", email: "sales3934@example.org", director_inn: "" },
  { inn: "9964739727", ogrn: "1087763901929", name: "ООО «Техно-Комплект 727»", registration_date: "2008-06-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 25", mass_address: "нет", phone: "+7 495 293-26-43", email: "sales9727@example.org", director_inn: "" },
  { inn: "9908255183", ogrn: "1197795276032", name: "ООО «Техно-Комплект 183»", registration_date: "2019-04-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 5", mass_address: "нет", phone: "+7 495 856-98-93", email: "sales5183@example.org", director_inn: "" },
  { inn: "9961994172", ogrn: "1207779184917", name: "ООО «Оборудование-Комплект 172»", registration_date: "2020-06-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 70", mass_address: "нет", phone: "+7 495 254-39-71", email: "sales4172@example.org", director_inn: "" },
  { inn: "9958033620", ogrn: "1157721108322", name: "ООО «Техно-Маркет 620»", registration_date: "2015-12-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 2", mass_address: "нет", phone: "+7 495 328-11-84", email: "sales3620@example.org", director_inn: "" },
  { inn: "9993280999", ogrn: "1207775628782", name: "ООО «Индустрия-Маркет 999»", registration_date: "2020-10-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 26", mass_address: "нет", phone: "+7 495 514-24-56", email: "sales0999@example.org", director_inn: "" },
  { inn: "9937546571", ogrn: "1137706439988", name: "ООО «Техно-Комплект 571»", registration_date: "2013-02-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 87", mass_address: "нет", phone: "+7 495 738-70-25", email: "sales6571@example.org", director_inn: "" },
  { inn: "9900905432", ogrn: "1107736513811", name: "ООО «Индустрия-Снаб 432»", registration_date: "2010-03-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 10", mass_address: "нет", phone: "+7 495 106-65-45", email: "sales5432@example.org", director_inn: "" },
  { inn: "9987862371", ogrn: "1107737496927", name: "ООО «Пром-Снаб 371»", registration_date: "2010-12-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 62", mass_address: "нет", phone: "+7 495 368-18-75", email: "sales2371@example.org", director_inn: "" },
  { inn: "9955348621", ogrn: "1207738136442", name: "ООО «Оборудование-Снаб 621»", registration_date: "2020-10-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 63", mass_address: "нет", phone: "+7 495 407-61-61", email: "sales8621@example.org", director_inn: "" },
  { inn: "9975461167", ogrn: "1127733842664", name: "ООО «Техно-Маркет 167»", registration_date: "2012-09-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 17", mass_address: "нет", phone: "+7 495 235-94-26", email: "sales1167@example.org", director_inn: "" },
  { inn: "9966429047", ogrn: "1097711304785", name: "ООО «Индустрия-Комплект 047»", registration_date: "2009-08-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 36", mass_address: "нет", phone: "+7 495 689-27-45", email: "sales9047@example.org", director_inn: "" },
  { inn: "9984416185", ogrn: "1197704652559", name: "ООО «Индустрия-Сервис 185»", registration_date: "2019-09-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 90", mass_address: "нет", phone: "+7 495 339-81-72", email: "sales6185@example.org", director_inn: "" },
  { inn: "9945587388", ogrn: "1097760751033", name: "ООО «Оборудование-Сервис 388»", registration_date: "2009-09-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 33", mass_address: "нет", phone: "+7 495 234-39-86", email: "sales7388@example.org", director_inn: "" },
  { inn: "9918934554", ogrn: "1137766643680", name: "ООО «Индустрия-Маркет 554»", registration_date: "2013-09-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 19", mass_address: "нет", phone: "+7 495 104-20-61", email: "sales4554@example.org", director_inn: "" },
  { inn: "9967526580", ogrn: "1187729489808", name: "ООО «Оборудование-Комплект 580»", registration_date: "2018-11-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 29", mass_address: "нет", phone: "+7 495 260-98-28", email: "sales6580@example.org", director_inn: "" },
  { inn: "9955995065", ogrn: "1197771899234", name: "ООО «Индустрия-Снаб 065»", registration_date: "2019-01-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 90", mass_address: "нет", phone: "+7 495 316-87-26", email: "sales5065@example.org", director_inn: "" },
  { inn: "9991205481", ogrn: "1107716190353", name: "ООО «Техно-Снаб 481»", registration_date: "2010-04-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 13", mass_address: "нет", phone: "+7 495 500-78-74", email: "sales5481@example.org", director_inn: "" },
  { inn: "9951695448", ogrn: "1087737704771", name: "ООО «Оборудование-Сервис 448»", registration_date: "2008-11-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 81", mass_address: "нет", phone: "+7 495 265-96-89", email: "sales5448@example.org", director_inn: "" },
  { inn: "9953994228", ogrn: "1197702188712", name: "ООО «Индустрия-Маркет 228»", registration_date: "2019-02-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 5", mass_address: "нет", phone: "+7 495 914-36-24", email: "sales4228@example.org", director_inn: "" },
  { inn: "9927819170", ogrn: "1117775482987", name: "ООО «Техно-Сервис 170»", registration_date: "2011-01-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 15", mass_address: "нет", phone: "+7 495 978-30-64", email: "sales9170@example.org", director_inn: "" },
  { inn: "9963393667", ogrn: "1197778560395", name: "ООО «Индустрия-Сервис 667»", registration_date: "2019-05-15", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 36", mass_address: "нет", phone: "+7 495 252-48-43", email: "sales3667@example.org", director_inn: "" },
  { inn: "9956830041", ogrn: "1267764995729", name: "ООО «Техно-Снаб 041»", registration_date: "2026-08-03", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 2", mass_address: "нет", phone: "+7 495 217-46-25", email: "sales0041@example.org", director_inn: "" },
  { inn: "9952183555", ogrn: "1157718120891", name: "ООО «Техно-Снаб 555»", registration_date: "2015-04-17", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 35", mass_address: "да", phone: "+7 495 914-29-37", email: "sales3555@example.org", director_inn: "" },
  { inn: "9971871518", ogrn: "1157719167026", name: "ООО «Техно-Комплект 518»", registration_date: "2015-04-17", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 90", mass_address: "нет", phone: "+7 495 158-14-32", email: "sales1518@example.org", director_inn: "996550203790" },
  { inn: "9953798978", ogrn: "1157797333729", name: "ООО «Индустрия-Маркет 978»", registration_date: "2015-04-17", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 41", mass_address: "нет", phone: "+7 495 196-62-21", email: "sales8978@example.org", director_inn: "" },
  { inn: "9903562335", ogrn: "1157751912259", name: "ООО «Индустрия-Маркет 335»", registration_date: "2015-04-17", status: "ACTIVE", address: "г. Москва, ул. Промышленная, д. 90", mass_address: "нет", phone: "+7 495 997-77-94", email: "sales2335@example.org", director_inn: "" },
];

export function innValid(v: string): boolean {
  if (!/^\d{10}$|^\d{12}$/.test(v)) return false;
  const d = [...v].map(Number);
  const c = (w: number[]) => w.reduce((s, n, i) => s + n * d[i], 0) % 11 % 10;
  return d.length === 10
    ? c([2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[9]
    : c([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[10] && c([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[11];
}

export function lookupSupplier(inn: string): { status: 'found' | 'notfound' | 'invalid'; supplier?: Supplier } {
  if (!innValid(inn)) {
    return { status: 'invalid' };
  }
  const s = BANK_SUPPLIERS.find((item) => item.inn === inn);
  if (s) {
    return { status: 'found', supplier: s };
  }
  return { status: 'notfound' };
}

export interface BankObligation {
  obligationRef: string;
  kind: string;
  monthlyMaxPaymentRub: number;
}

export const SAMPLE_OBLIGATIONS: BankObligation[] = [
  { obligationRef: 'DEBT-8155-A', kind: 'Кредит для бизнеса', monthlyMaxPaymentRub: 29500 },
  { obligationRef: 'DEBT-2602-A', kind: 'Ипотека коммерческая', monthlyMaxPaymentRub: 31900 },
];
