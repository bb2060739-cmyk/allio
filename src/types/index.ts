export type SupportedLanguage = 'ar' | 'en' | 'fr' | 'es';
export type LocalizedString = string | Partial<Record<SupportedLanguage, string>>;

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface StoreDesign {
  primaryColor: string; // Hex color e.g. '#059669'
  secondaryColor: string; // Hex color e.g. '#0f172a'
  logoType: 'text' | 'image';
  logoText: string;
  logoImageUrl?: string;
  faviconUrl?: string;
  announcementText?: LocalizedString;
  // Storefront Catalog CMS customization
  heroBadge?: LocalizedString;
  heroTitle?: LocalizedString;
  heroSubtitle?: LocalizedString;
  pillar1Title?: LocalizedString;
  pillar1Desc?: LocalizedString;
  pillar2Title?: LocalizedString;
  pillar2Desc?: LocalizedString;
  pillar3Title?: LocalizedString;
  pillar3Desc?: LocalizedString;
  catalogTitle?: LocalizedString;
  catalogSubtitle?: LocalizedString;
  buyButtonText?: LocalizedString;
  buyButtonColor?: string;
  buyButtonTextColor?: string;
  footerText?: LocalizedString;
  footerCopyright?: LocalizedString;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  niche: string;
  currency: string;
  isDefault?: boolean;
  design: StoreDesign;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSectionConfig {
  enabled: boolean;
  badgeText?: LocalizedString;
  headline?: LocalizedString;
  subheadline?: LocalizedString;
  ctaText?: LocalizedString;
  ctaColor?: string;
  ctaTextColor?: string;
  heroImageUrl?: string;
}

export interface ScarcitySectionConfig {
  enabled: boolean;
  stockText?: LocalizedString; // Supports {stock} placeholder
  viewersText?: LocalizedString; // Supports {count} placeholder
}

export interface FeatureItem {
  id: string;
  title: LocalizedString;
  description?: LocalizedString;
}

export interface FeaturesSectionConfig {
  enabled: boolean;
  title?: LocalizedString;
  items: FeatureItem[];
}

export interface TestimonialItem {
  id: string;
  name: LocalizedString;
  city: LocalizedString;
  rating: number;
  comment: LocalizedString;
  avatarUrl?: string;
}

export interface TestimonialsSectionConfig {
  enabled: boolean;
  title?: LocalizedString;
  verifiedBadgeText?: LocalizedString;
  ratingNoteText?: LocalizedString;
  items: TestimonialItem[];
}

export interface GuaranteeSectionConfig {
  enabled: boolean;
  title?: LocalizedString;
  description?: LocalizedString;
  badgeText?: LocalizedString;
  bgColor?: string;
  textColor?: string;
}

export interface ReassurancesSectionConfig {
  enabled: boolean;
  items: LocalizedString[];
}

export interface OrderFormDesignConfig {
  enabled: boolean;
  title?: LocalizedString;
  subtitle?: LocalizedString;
  submitButtonText?: LocalizedString;
  submitButtonSubtext?: LocalizedString;
  submitButtonColor?: string;
  submitButtonTextColor?: string;
  freeShippingText?: LocalizedString;
  callConfirmationText?: LocalizedString;
  trustBadge1Title?: LocalizedString;
  trustBadge1Sub?: LocalizedString;
  trustBadge2Title?: LocalizedString;
  trustBadge2Sub?: LocalizedString;
  trustBadge3Title?: LocalizedString;
  trustBadge3Sub?: LocalizedString;
}

export interface FooterSectionConfig {
  enabled: boolean;
  text?: LocalizedString;
  copyrightText?: LocalizedString;
}

export interface LandingPageDesignConfig {
  headerCtaText?: LocalizedString;
  headerCtaColor?: string;
  hero: HeroSectionConfig;
  scarcity?: ScarcitySectionConfig;
  features: FeaturesSectionConfig;
  testimonials: TestimonialsSectionConfig;
  guarantee: GuaranteeSectionConfig;
  reassurances?: ReassurancesSectionConfig;
  orderForm?: OrderFormDesignConfig;
  footer?: FooterSectionConfig;
  stickyMobileCtaText?: LocalizedString;
}

export interface Product {
  id: string;
  storeId?: string; // Belongs to Store
  slug: string;
  name: LocalizedString;
  price: number; // In Moroccan Dirhams (DH)
  originalPrice?: number;
  currency: 'DH' | 'MAD';
  shortDescription: LocalizedString;
  fullDescription: LocalizedString;
  features: LocalizedString[];
  images: string[];
  badge?: LocalizedString;
  freeShipping: boolean;
  inStock: boolean;
  stockCount: number;
  fbPixelId?: string;
  tiktokPixelId?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  salesCount: number;
  designConfig?: LandingPageDesignConfig;
  blocks?: LayoutBlock[]; // JSON array of layout blocks for the Visual Block-Based Page Builder
}

export type LayoutBlockType = 
  | 'hero' 
  | 'scarcity'
  | 'gallery' 
  | 'features' 
  | 'testimonials' 
  | 'guarantee' 
  | 'reassurances' 
  | 'order_form' 
  | 'footer'
  | 'custom_text';

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType;
  title?: string;
  enabled: boolean;
  data: Record<string, any>;
}

export type LandingPage = Product;

export interface Order {
  id: string;
  orderNumber: string;
  storeId?: string;
  productId: string;
  productName: string;
  customerName: string;
  phoneNumber: string; // Validated 10 digits starting with 06, 07, 05
  city: string;
  address: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number;
  totalPrice: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fbPixelFired?: boolean;
  tiktokPixelFired?: boolean;
}

export interface MoroccanCity {
  id: string;
  nameAr: string;
  nameFr: string;
  shippingDelay: string;
  standardFee: number;
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  platform: 'facebook' | 'tiktok';
  pixelId: string;
  eventName: string;
  data: Record<string, unknown>;
}

export interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export type VisitorDeviceType = 'mobile' | 'desktop' | 'tablet';
export type VisitorOS = 'iOS' | 'Android' | 'Windows' | 'Mac' | 'Linux' | 'Other';

export interface VisitorSession {
  id: string;
  timestamp: string; // ISO string
  deviceType: VisitorDeviceType;
  os: VisitorOS;
  browser: string;
  referrer: string; // Categorized: 'Facebook' | 'TikTok' | 'Instagram' | 'Google' | 'Snapchat' | 'Direct' | string
  referrerUrl?: string;
  country: string; // e.g. "Morocco", "MA"
  countryCode?: string;
  city?: string;
  path: string; // e.g. "/smart-watch" or "/"
  storeId?: string;
  pageTitle?: string;
}

export interface DailyAnalyticsDoc {
  date: string; // 'YYYY-MM-DD'
  totalVisits: number;
  sessions: VisitorSession[];
  lastUpdated: string;
}

