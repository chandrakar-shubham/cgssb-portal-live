export type BlockType =
  | 'hero'
  | 'heading'
  | 'paragraph'
  | 'features'
  | 'faq'
  | 'test_series_widget'
  | 'cta'
  | 'raw_html'
  | 'image_banner';

export interface PageBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  faqList?: Array<{
    question: string;
    answer: string;
  }>;
  categoryFilter?: string;
}

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  blocks: PageBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface CMSPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  featuredImage?: string;
  excerpt: string;
  content: string;
  tags: string[];
  author: string;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
}

export interface CMSTestSeriesPack {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  price: number;
  isPro: boolean;
  mockTestIds: string[];
  bannerUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  url: string; // e.g. "/p/about" or "/exams/cgpsc" or "/posts"
  isExternal?: boolean;
}

export interface CMSSiteSettings {
  siteName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  copyrightText?: string;
  primaryColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
  announcementBar: {
    enabled: boolean;
    message: string;
    buttonText?: string;
    buttonLink?: string;
  };
  navMenu: NavMenuItem[];
  footerLinks: Array<{
    title: string;
    links: Array<{ label: string; url: string }>;
  }>;
}
