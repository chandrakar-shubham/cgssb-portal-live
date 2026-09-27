import { CurrentAffairsSourceRegistryItem, CurrentAffairSource } from '../types/currentAffairs';

export const INITIAL_OFFICIAL_SOURCES: CurrentAffairsSourceRegistryItem[] = [
  {
    id: 'src-cg-dpr-1',
    name: 'Chhattisgarh DPR News Portal (Main)',
    organization: 'Public Relations Department, Government of Chhattisgarh',
    category: 'chhattisgarh',
    url: 'https://jansampark.cg.gov.in/dprnewsportal/MainPage.aspx',
    priority: 'mandatory',
    enabled: true,
    description: 'Primary official state news portal for cabinet decisions, schemes, and announcements.'
  },
  {
    id: 'src-cg-dpr-2',
    name: 'Chhattisgarh DPR Page Portal',
    organization: 'Public Relations Department, Government of Chhattisgarh',
    category: 'chhattisgarh',
    url: 'https://jansampark.cg.gov.in/dprnewsportal/page.aspx',
    priority: 'mandatory',
    enabled: true,
    description: 'State government policy updates and press releases.'
  },
  {
    id: 'src-cg-dpr-3',
    name: 'Chhattisgarh DPR Notifications',
    organization: 'Public Relations Department, Government of Chhattisgarh',
    category: 'chhattisgarh',
    url: 'https://jansampark.cg.gov.in/dprnewsportal/Notification.aspx',
    priority: 'mandatory',
    enabled: true,
    description: 'Official government notifications and orders.'
  },
  {
    id: 'src-cg-fin-1',
    name: 'Chhattisgarh Finance Department Portal',
    organization: 'Finance Department, Government of Chhattisgarh',
    category: 'chhattisgarh',
    url: 'https://finance.cg.gov.in/',
    priority: 'mandatory',
    enabled: true,
    description: 'State financial policies, fiscal updates, and treasury circulars.'
  },
  {
    id: 'src-cg-budget-1',
    name: 'Chhattisgarh Budget Document Hub',
    organization: 'Finance Department, Government of Chhattisgarh',
    category: 'chhattisgarh',
    url: 'https://finance.cg.gov.in/budget_doc/budget.asp',
    priority: 'mandatory',
    enabled: true,
    description: 'Official budget publications and financial statements.'
  },
  {
    id: 'src-cg-budget-2026',
    name: 'Chhattisgarh Budget 2026-27 Portal',
    organization: 'Finance Department, Government of Chhattisgarh',
    category: 'chhattisgarh',
    url: 'https://finance.cg.gov.in/budget_doc/main_budget.asp?year1=2026',
    priority: 'mandatory',
    enabled: true,
    description: 'Complete budgetary allocations, fiscal indicators, and sectoral schemes for 2026-27.'
  },
  {
    id: 'src-pib-1',
    name: 'Press Information Bureau (PIB) India',
    organization: 'Ministry of Information and Broadcasting, Government of India',
    category: 'india',
    url: 'https://www.pib.gov.in/',
    priority: 'mandatory',
    enabled: true,
    description: 'Central government nodal agency for official press releases.'
  },
  {
    id: 'src-pib-rel',
    name: 'PIB Regional Releases',
    organization: 'PIB India',
    category: 'india',
    url: 'https://www.pib.gov.in/allreleasem.aspx?lang=1&reg=3',
    priority: 'high',
    enabled: true,
    description: 'Regional and state-level central government releases.'
  },
  {
    id: 'src-niti-1',
    name: 'NITI Aayog Official Portal',
    organization: 'NITI Aayog, Government of India',
    category: 'india',
    url: 'https://www.niti.gov.in/',
    priority: 'mandatory',
    enabled: true,
    description: 'Think tank policy papers, indices, and national development strategies.'
  },
  {
    id: 'src-isro-1',
    name: 'ISRO Official Portal',
    organization: 'Indian Space Research Organisation',
    category: 'india',
    url: 'https://www.isro.gov.in/',
    priority: 'high',
    enabled: true,
    description: 'Space missions, satellite launches, and scientific developments.'
  },
  {
    id: 'src-rbi-1',
    name: 'Reserve Bank of India (RBI)',
    organization: 'RBI',
    category: 'india',
    url: 'https://www.rbi.org.in/',
    priority: 'high',
    enabled: true,
    description: 'Monetary policy, financial stability reports, and banking statistics.'
  }
];

export const INITIAL_CA_SOURCES: CurrentAffairSource[] = INITIAL_OFFICIAL_SOURCES.map(s => ({
  id: s.id,
  name: s.name,
  organization: s.organization,
  type: s.category === 'chhattisgarh' ? 'government' : s.id.includes('pib') ? 'pib' : s.id.includes('niti') ? 'niti_aayog' : s.id.includes('isro') ? 'isro' : s.id.includes('rbi') ? 'rbi' : 'government',
  url: s.url,
  region: s.category,
  verificationStatus: 'verified',
  verificationDate: new Date().toISOString(),
  priority: s.priority === 'mandatory' ? 'primary' : 'secondary',
  evidenceSummary: s.description
}));
