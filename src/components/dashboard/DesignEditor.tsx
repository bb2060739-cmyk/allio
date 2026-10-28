import React, { useState, useEffect, useRef } from 'react';
import { Store, Product, LayoutBlock, LayoutBlockType } from '../../types';
import { saveStore, saveProduct, getDefaultLayoutBlocks } from '../../lib/storage';
import { getLocalizedText } from '../../utils/i18n';
import { 
  Palette, Layers, Check, Eye, EyeOff, Plus, Trash2, 
  Sparkles, ShieldCheck, Star, ArrowRight, ArrowUp, ArrowDown, 
  Loader2, Save, Store as StoreIcon, Image as ImageIcon,
  Upload, X, ShoppingBag, Truck, RefreshCw,
  CheckCircle, Flame, ChevronDown, ChevronUp, GripVertical,
  Smartphone, Monitor, ExternalLink
} from 'lucide-react';
import { validateImageFile, processAndCompressImage, MAX_IMAGE_SIZE_MB } from '../../lib/imageOptimization';

interface DesignEditorProps {
  stores: Store[];
  products: Product[];
  initialStoreId?: string;
  initialProductId?: string;
  onDataChange: () => void;
  onViewProduct: (product: Product) => void;
}

const PRESET_PRIMARY_COLORS = [
  { name: 'زمردي كلاسيكي (Emerald)', value: '#059669' },
  { name: 'أزرق ملكي (Royal Blue)', value: '#2563EB' },
  { name: 'نيلي فاخر (Indigo)', value: '#4F46E5' },
  { name: 'عنابي / ياقوتي (Crimson)', value: '#DC2626' },
  { name: 'عنبري دافئ (Amber)', value: '#D97706' },
  { name: 'أرجواني عصري (Purple)', value: '#7C3AED' },
  { name: 'فيروزي مغربي (Teal)', value: '#0D9488' },
  { name: 'وردي أنيق (Rose)', value: '#E11D48' }
];

const PRESET_SECONDARY_COLORS = [
  { name: 'سليت داكن (Slate-900)', value: '#0F172A' },
  { name: 'فحمي عميق (Charcoal)', value: '#18181B' },
  { name: 'كحلي ناعم (Navy)', value: '#1E293B' },
  { name: 'أسود مطفي (Onyx)', value: '#000000' }
];

const AVAILABLE_BLOCK_TYPES: { type: LayoutBlockType; label: string; desc: string; icon: any }[] = [
  { type: 'hero', label: 'قسم الواجهة الترويجية (Hero Section)', desc: 'العنوان الرئيسي، الشارة الترويجية، زر الطلب، وصورة الواجهة', icon: Sparkles },
  { type: 'scarcity', label: 'شريط ندرة المخزون والزوار (Scarcity Banner)', desc: 'عد تنازلي للمخزون المتبقي وعدد الزوار النشطين', icon: Flame },
  { type: 'gallery', label: 'معرض صور المنتج (Product Gallery)', desc: 'عرض صور وتفاصيل المنتج بجودة عالية', icon: ImageIcon },
  { type: 'features', label: 'المميزات والمواصفات (Key Features)', desc: 'قائمة المميزات الرئيسية ونقاط قوة المنتج', icon: Check },
  { type: 'testimonials', label: 'آراء وتقييمات الزبائن (Testimonials)', desc: 'تجارب وآراء الزبائن الحقيقيين مع المدن والشارات', icon: Star },
  { type: 'guarantee', label: 'قسم الضمان وثقة المتجر (Guarantee)', desc: 'سياسة المعاينة قبل الدفع وضمان الرضا والاستبدال', icon: ShieldCheck },
  { type: 'reassurances', label: 'نقاط الطمأنينة (Trust Points)', desc: 'شارات الثقة للتوصيل السريع والدفع عند الاستلام', icon: CheckCircle },
  { type: 'order_form', label: 'استمارة الطلب السريع COD (Order Form)', desc: 'استمارة إدخال الاسم، الهاتف، والمدينة مع أزرار التأكيد', icon: ShoppingBag },
  { type: 'footer', label: 'تذييل الصفحة وحقوق النشر (Footer)', desc: 'نصوص حقوق الملكية وروابط المتجر', icon: Layers }
];

export const DesignEditor: React.FC<DesignEditorProps> = ({
  stores,
  products,
  initialStoreId,
  initialProductId,
  onDataChange,
  onViewProduct
}) => {
  // Navigation level: 'landing' (Visual Page Builder) or 'store' (Store Settings)
  const [editorLevel, setEditorLevel] = useState<'store' | 'landing'>(initialProductId ? 'landing' : 'landing');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || stores[0]?.id || 'store-default');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || products[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [expandedBlockIds, setExpandedBlockIds] = useState<Record<string, boolean>>({
    'block-hero': true,
    'block-order-form': true
  });

  // Active Store & Product objects
  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Auto-switch to landing level when initialProductId is provided
  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
      setEditorLevel('landing');
    }
    if (initialStoreId) {
      setSelectedStoreId(initialStoreId);
    }
  }, [initialProductId, initialStoreId]);

  // =========================================================================
  // 1. STORE LEVEL CMS STATE
  // =========================================================================
  const [storePrimaryColor, setStorePrimaryColor] = useState(activeStore?.design?.primaryColor || '#059669');
  const [storeSecondaryColor, setStoreSecondaryColor] = useState(activeStore?.design?.secondaryColor || '#0f172a');
  const [storeLogoType, setStoreLogoType] = useState<'text' | 'image'>(activeStore?.design?.logoType || 'text');
  const [storeLogoText, setStoreLogoText] = useState(activeStore?.design?.logoText || activeStore?.name || 'Allio');
  const [storeLogoImageUrl, setStoreLogoImageUrl] = useState(activeStore?.design?.logoImageUrl || '');
  const [storeFaviconUrl, setStoreFaviconUrl] = useState(activeStore?.design?.faviconUrl || activeStore?.design?.logoImageUrl || '');
  const [storeAnnouncement, setStoreAnnouncement] = useState(
    typeof activeStore?.design?.announcementText === 'string' 
      ? activeStore.design.announcementText 
      : getLocalizedText(activeStore?.design?.announcementText, 'ar', 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام')
  );

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  // Sync store form when active store changes
  useEffect(() => {
    if (activeStore) {
      setStorePrimaryColor(activeStore.design?.primaryColor || '#059669');
      setStoreSecondaryColor(activeStore.design?.secondaryColor || '#0f172a');
      setStoreLogoType(activeStore.design?.logoType || (activeStore.design?.logoImageUrl ? 'image' : 'text'));
      setStoreLogoText(activeStore.design?.logoText || activeStore.name || 'Allio');
      setStoreLogoImageUrl(activeStore.design?.logoImageUrl || '');
      setStoreFaviconUrl(activeStore.design?.faviconUrl || activeStore.design?.logoImageUrl || '');
      setStoreAnnouncement(
        typeof activeStore.design?.announcementText === 'string'
          ? activeStore.design.announcementText
          : getLocalizedText(activeStore.design?.announcementText, 'ar', 'توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام')
      );
    }
  }, [activeStore]);

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadError(null);
    const val = validateImageFile(file);
    if (!val.valid) {
      setLogoUploadError(val.error || `حجم الصورة يتجاوز الحد الأقصى (${MAX_IMAGE_SIZE_MB} ميغابايت).`);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingLogo(true);
      const { dataUrl } = await processAndCompressImage(file, 800);
      setStoreLogoImageUrl(dataUrl);
      setStoreFaviconUrl(dataUrl);
      setStoreLogoType('image');
    } catch (err) {
      setLogoUploadError(err instanceof Error ? err.message : 'فشل معالجة ورفع الشعار');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleSaveStoreDesign = async () => {
    if (!activeStore) return;
    setIsSaving(true);
    setSaveToast(null);

    try {
      await saveStore({
        id: activeStore.id,
        name: activeStore.name,
        slug: activeStore.slug,
        niche: activeStore.niche,
        description: activeStore.description,
        design: {
          ...activeStore.design,
          primaryColor: storePrimaryColor,
          secondaryColor: storeSecondaryColor,
          logoType: storeLogoType,
          logoText: storeLogoText.trim() || 'Allio',
          logoImageUrl: storeLogoImageUrl.trim(),
          faviconUrl: (storeFaviconUrl || storeLogoImageUrl).trim(),
          announcementText: storeAnnouncement.trim()
        }
      });

      setSaveToast('تم حفظ هوية وإعدادات المتجر بنجاح في قاعدة بيانات Firestore!');
      onDataChange();
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Failed to save store branding:', err);
      setSaveToast('حدث خطأ أثناء حفظ إعدادات المتجر في Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 2. BLOCK-BASED VISUAL PAGE BUILDER STATE (LANDING PAGES)
  // =========================================================================
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);

  // Initialize or load blocks whenever activeProduct changes
  useEffect(() => {
    if (activeProduct) {
      if (activeProduct.blocks && Array.isArray(activeProduct.blocks) && activeProduct.blocks.length > 0) {
        setBlocks(activeProduct.blocks);
      } else {
        const prodName = typeof activeProduct.name === 'string' ? activeProduct.name : getLocalizedText(activeProduct.name);
        const prodDesc = typeof activeProduct.shortDescription === 'string' ? activeProduct.shortDescription : getLocalizedText(activeProduct.shortDescription);
        setBlocks(getDefaultLayoutBlocks(prodName, prodDesc, activeProduct.images || []));
      }
    }
  }, [activeProduct]);

  // Block manipulation helpers
  const toggleBlockExpanded = (id: string) => {
    setExpandedBlockIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moveBlockUp = (index: number) => {
    if (index <= 0) return;
    setBlocks(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveBlockDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    setBlocks(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const toggleBlockEnabled = (index: number) => {
    setBlocks(prev => {
      const next = [...prev];
      next[index] = { ...next[index], enabled: !next[index].enabled };
      return next;
    });
  };

  const deleteBlock = (index: number) => {
    const block = blocks[index];
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف "${block.title || block.type}" من هذه الصفحة؟`)) {
      setBlocks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBlockData = (index: number, key: string, value: any) => {
    setBlocks(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        data: {
          ...next[index].data,
          [key]: value
        }
      };
      return next;
    });
  };

  const handleAddNewBlock = (type: LayoutBlockType) => {
    const prodName = activeProduct ? (typeof activeProduct.name === 'string' ? activeProduct.name : getLocalizedText(activeProduct.name)) : '';
    const prodImages = activeProduct?.images || [];
    const template = getDefaultLayoutBlocks(prodName, '', prodImages).find(b => b.type === type);

    const newBlock: LayoutBlock = {
      id: `block-${type}-${Date.now()}`,
      type,
      title: template?.title || `قسم ${type}`,
      enabled: true,
      data: template?.data ? JSON.parse(JSON.stringify(template.data)) : {}
    };

    setBlocks(prev => [...prev, newBlock]);
    setExpandedBlockIds(prev => ({ ...prev, [newBlock.id]: true }));
    setIsAddBlockModalOpen(false);
  };

  // Save the full blocks layout JSON array to Firestore
  const handleSaveBlocksLayout = async () => {
    if (!activeProduct) return;
    setIsSaving(true);
    setSaveToast(null);

    try {
      await saveProduct({
        ...activeProduct,
        blocks
      });

      setSaveToast(`تم حفظ تخطيط وأقسام صفحة الهبوط "${typeof activeProduct.name === 'string' ? activeProduct.name : getLocalizedText(activeProduct.name)}" بنجاح في Firestore!`);
      onDataChange();
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Failed to save layout blocks:', err);
      setSaveToast('حدث خطأ أثناء حفظ تخطيط الصفحة في Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const pColor = activeStore?.design?.primaryColor || '#059669';

  return (
    <div className="space-y-6">
      {/* Top Banner & Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">
              {editorLevel === 'landing' 
                ? 'محرر البلوكات المرئي لصفحات الهبوط (Visual Block Page Builder)' 
                : 'إعدادات وهوية المتجر العام (Store Settings)'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {editorLevel === 'landing'
              ? 'أضف، رتب، وعدل بلوكات صفحة الهبوط (Hero, Features, Gallery, Testimonials, Form...) بسهولة مع حفظ التخطيط كـ JSON في Firestore.'
              : 'خصص ألوان المتجر، الشعار، أيقونة التبويب (Favicon) وشريط الإعلانات العام.'}
          </p>
        </div>

        {/* Level Toggle Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start md:self-auto shrink-0">
          <button
            onClick={() => setEditorLevel('landing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorLevel === 'landing'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>محرر البلوكات (Page Builder)</span>
          </button>

          <button
            onClick={() => setEditorLevel('store')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              editorLevel === 'store'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>إعدادات المتجر (Store Settings)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {saveToast && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEVEL 1: VISUAL BLOCK-BASED PAGE BUILDER (LANDING PAGES) */}
      {/* ===================================================================== */}
      {editorLevel === 'landing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Blocks Builder Column (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Toolbar: Landing Page Picker & Quick Actions */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">صفحة الهبوط المستهدفة للتحرير:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  {products.map((p) => {
                    const linkedStore = stores.find(s => s.id === p.storeId);
                    const name = typeof p.name === 'string' ? p.name : getLocalizedText(p.name);
                    return (
                      <option key={p.id} value={p.id}>
                        {name} ({p.price} DH) — [متجر: {linkedStore?.name || 'الرئيسي'}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-4">
                {activeProduct && (
                  <button
                    onClick={() => onViewProduct(activeProduct)}
                    title="معاينة الصفحة الحية"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>معاينة حية</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsAddBlockModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة بلوك</span>
                </button>
              </div>
            </div>

            {/* Layout Blocks List */}
            <div className="space-y-3">
              {blocks.map((block, idx) => {
                const isExpanded = Boolean(expandedBlockIds[block.id]);
                const blockMeta = AVAILABLE_BLOCK_TYPES.find(b => b.type === block.type);
                const IconComponent = blockMeta?.icon || Layers;

                return (
                  <div 
                    key={block.id || idx}
                    className={`bg-white rounded-2xl border transition-all ${
                      block.enabled 
                        ? 'border-slate-200 shadow-xs' 
                        : 'border-slate-200 bg-slate-50/60 opacity-60'
                    }`}
                  >
                    {/* Block Header */}
                    <div className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1 text-slate-400">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {idx + 1}. {block.title || blockMeta?.label || block.type}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                              {block.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Reorder, Toggle Visibility, Delete, Expand */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveBlockUp(idx)}
                          disabled={idx === 0}
                          title="تحريك لأعلى"
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlockDown(idx)}
                          disabled={idx === blocks.length - 1}
                          title="تحريك لأسفل"
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlockEnabled(idx)}
                          title={block.enabled ? 'إخفاء البلوك' : 'إظهار البلوك'}
                          className={`p-1 rounded cursor-pointer ${block.enabled ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400'}`}
                        >
                          {block.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(idx)}
                          title="حذف البلوك"
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlockExpanded(block.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Block Settings Body (when expanded) */}
                    {isExpanded && (
                      <div className="p-4 space-y-3.5 text-xs bg-slate-50/40 rounded-b-2xl border-t border-slate-50">
                        {/* HERO BLOCK SETTINGS */}
                        {block.type === 'hero' && (
                          <div className="space-y-3">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">الشارة الترويجية (Badge Text):</label>
                              <input
                                type="text"
                                value={block.data.badgeText || ''}
                                onChange={(e) => updateBlockData(idx, 'badgeText', e.target.value)}
                                placeholder="عرض حصري بالمغرب 🔥"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">العنوان الرئيسي (Headline):</label>
                              <input
                                type="text"
                                value={block.data.headline || ''}
                                onChange={(e) => updateBlockData(idx, 'headline', e.target.value)}
                                placeholder="عنوان جذاب يبرز الفائدة الرئيسية"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-black"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">الوصف الفرعي (Subheadline):</label>
                              <textarea
                                rows={2}
                                value={block.data.subheadline || ''}
                                onChange={(e) => updateBlockData(idx, 'subheadline', e.target.value)}
                                placeholder="تفاصيل إضافية تدعم العنوان الرئيسي..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">نص زر الطلب (CTA Button):</label>
                                <input
                                  type="text"
                                  value={block.data.ctaText || ''}
                                  onChange={(e) => updateBlockData(idx, 'ctaText', e.target.value)}
                                  placeholder="اطلب الآن - الدفع عند الاستلام"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">لون الزر:</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={block.data.ctaColor || pColor}
                                    onChange={(e) => updateBlockData(idx, 'ctaColor', e.target.value)}
                                    className="w-7 h-7 rounded cursor-pointer border border-slate-200 bg-white"
                                  />
                                  <span className="font-mono text-[11px] text-slate-500">{block.data.ctaColor || pColor}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">صورة الواجهة (اختياري - URL):</label>
                              <input
                                type="url"
                                value={block.data.heroImageUrl || ''}
                                onChange={(e) => updateBlockData(idx, 'heroImageUrl', e.target.value)}
                                placeholder="اتركه فارغاً لاستخدام صور المنتج الرئيسية"
                                dir="ltr"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                              />
                            </div>
                          </div>
                        )}

                        {/* SCARCITY BLOCK SETTINGS */}
                        {block.type === 'scarcity' && (
                          <div className="space-y-3">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">نص ندرة المخزون (استخدم {'{stock}'}):</label>
                              <input
                                type="text"
                                value={block.data.stockText || ''}
                                onChange={(e) => updateBlockData(idx, 'stockText', e.target.value)}
                                placeholder="طلب مرتفع اليوم بالمغرب: بقي فقط {stock} قطع بالمستودع"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">نص عدد الزوار (استخدم {'{count}'}):</label>
                              <input
                                type="text"
                                value={block.data.viewersText || ''}
                                onChange={(e) => updateBlockData(idx, 'viewersText', e.target.value)}
                                placeholder="{count} زائر يتصفحون هذا العرض حالياً"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {/* GALLERY BLOCK SETTINGS */}
                        {block.type === 'gallery' && (
                          <div className="space-y-3">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">عنوان المعرض:</label>
                              <input
                                type="text"
                                value={block.data.title || ''}
                                onChange={(e) => updateBlockData(idx, 'title', e.target.value)}
                                placeholder="صور وتفاصيل المنتج بدقة عالية"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold text-slate-700 block">روابط الصور ({(block.data.images || []).length}):</label>
                              {(block.data.images || []).map((imgUrl: string, imgIdx: number) => (
                                <div key={imgIdx} className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    value={imgUrl}
                                    dir="ltr"
                                    onChange={(e) => {
                                      const newImages = [...(block.data.images || [])];
                                      newImages[imgIdx] = e.target.value;
                                      updateBlockData(idx, 'images', newImages);
                                    }}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImages = (block.data.images || []).filter((_: any, i: number) => i !== imgIdx);
                                      updateBlockData(idx, 'images', newImages);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = [...(block.data.images || []), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'];
                                  updateBlockData(idx, 'images', newImages);
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>إضافة رابط صورة</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* FEATURES BLOCK SETTINGS */}
                        {block.type === 'features' && (
                          <div className="space-y-3">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">عنوان قسم المميزات:</label>
                              <input
                                type="text"
                                value={block.data.title || ''}
                                onChange={(e) => updateBlockData(idx, 'title', e.target.value)}
                                placeholder="أهم المميزات والمواصفات"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold text-slate-700 block">نقاط المميزات:</label>
                              {(block.data.items || []).map((feat: any, fIdx: number) => (
                                <div key={feat.id || fIdx} className="flex items-center gap-2">
                                  <span className="w-4 text-center font-bold text-slate-400 text-[10px]">{fIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={typeof feat.title === 'string' ? feat.title : getLocalizedText(feat.title)}
                                    onChange={(e) => {
                                      const newItems = [...(block.data.items || [])];
                                      newItems[fIdx] = { ...newItems[fIdx], title: e.target.value };
                                      updateBlockData(idx, 'items', newItems);
                                    }}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItems = (block.data.items || []).filter((_: any, i: number) => i !== fIdx);
                                      updateBlockData(idx, 'items', newItems);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [...(block.data.items || []), { id: `f-${Date.now()}`, title: 'ميزة جديدة حصرية' }];
                                  updateBlockData(idx, 'items', newItems);
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>إضافة ميزة جديدة</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TESTIMONIALS BLOCK SETTINGS */}
                        {block.type === 'testimonials' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">عنوان قسم التقييمات:</label>
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateBlockData(idx, 'title', e.target.value)}
                                  placeholder="آراء وتقييمات زبنائنا في المغرب"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">شارة المشتري المؤكد:</label>
                                <input
                                  type="text"
                                  value={block.data.verifiedBadgeText || ''}
                                  onChange={(e) => updateBlockData(idx, 'verifiedBadgeText', e.target.value)}
                                  placeholder="مشتري مؤكد ✓"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold text-slate-700 block">تقييمات الزبائن ({(block.data.items || []).length}):</label>
                              {(block.data.items || []).map((item: any, tIdx: number) => (
                                <div key={item.id || tIdx} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-700">تقييم #{tIdx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = (block.data.items || []).filter((_: any, i: number) => i !== tIdx);
                                        updateBlockData(idx, 'items', newItems);
                                      }}
                                      className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                                    >
                                      حذف
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={typeof item.name === 'string' ? item.name : getLocalizedText(item.name)}
                                      onChange={(e) => {
                                        const newItems = [...(block.data.items || [])];
                                        newItems[tIdx] = { ...newItems[tIdx], name: e.target.value };
                                        updateBlockData(idx, 'items', newItems);
                                      }}
                                      placeholder="اسم الزبون"
                                      className="px-2 py-1 rounded border border-slate-200 text-xs font-bold"
                                    />
                                    <input
                                      type="text"
                                      value={typeof item.city === 'string' ? item.city : getLocalizedText(item.city)}
                                      onChange={(e) => {
                                        const newItems = [...(block.data.items || [])];
                                        newItems[tIdx] = { ...newItems[tIdx], city: e.target.value };
                                        updateBlockData(idx, 'items', newItems);
                                      }}
                                      placeholder="المدينة"
                                      className="px-2 py-1 rounded border border-slate-200 text-xs"
                                    />
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={typeof item.comment === 'string' ? item.comment : getLocalizedText(item.comment)}
                                    onChange={(e) => {
                                      const newItems = [...(block.data.items || [])];
                                      newItems[tIdx] = { ...newItems[tIdx], comment: e.target.value };
                                      updateBlockData(idx, 'items', newItems);
                                    }}
                                    placeholder="نص تعليق ورأي الزبون..."
                                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                                  />
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [
                                    ...(block.data.items || []),
                                    { id: `t-${Date.now()}`, name: 'زبون جديد', city: 'الدار البيضاء', rating: 5, comment: 'تجربة ممتازة وتعامل محترم جداً!' }
                                  ];
                                  updateBlockData(idx, 'items', newItems);
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>إضافة تقييم جديد</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* GUARANTEE BLOCK SETTINGS */}
                        {block.type === 'guarantee' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">عنوان الضمان:</label>
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateBlockData(idx, 'title', e.target.value)}
                                  placeholder="ضمان الرضا والجودة في متجرنا"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">شارة الضمان (Badge):</label>
                                <input
                                  type="text"
                                  value={block.data.badgeText || ''}
                                  onChange={(e) => updateBlockData(idx, 'badgeText', e.target.value)}
                                  placeholder="ضمان ذهبي 100%"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">تفاصيل الضمان والمعاينة:</label>
                              <textarea
                                rows={2}
                                value={block.data.description || ''}
                                onChange={(e) => updateBlockData(idx, 'description', e.target.value)}
                                placeholder="نوفر لكم إمكانية المعاينة قبل الدفع..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white leading-relaxed"
                              />
                            </div>
                          </div>
                        )}

                        {/* REASSURANCES BLOCK SETTINGS */}
                        {block.type === 'reassurances' && (
                          <div className="space-y-2">
                            <label className="font-bold text-slate-700 block">نقاط الطمأنينة والثقة:</label>
                            {(block.data.items || []).map((item: string, rIdx: number) => (
                              <div key={rIdx} className="flex items-center gap-2">
                                <span className="font-bold text-slate-400 w-4 text-[10px]">{rIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const newItems = [...(block.data.items || [])];
                                    newItems[rIdx] = e.target.value;
                                    updateBlockData(idx, 'items', newItems);
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = (block.data.items || []).filter((_: any, i: number) => i !== rIdx);
                                    updateBlockData(idx, 'items', newItems);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...(block.data.items || []), 'نقطة طمأنينة جديدة'];
                                updateBlockData(idx, 'items', newItems);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>إضافة نقطة ثقة</span>
                            </button>
                          </div>
                        )}

                        {/* ORDER FORM BLOCK SETTINGS */}
                        {block.type === 'order_form' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">عنوان الاستمارة:</label>
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateBlockData(idx, 'title', e.target.value)}
                                  placeholder="استمارة الطلب السريع والدفع عند الاستلام"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">لون زر الطلب:</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={block.data.submitButtonColor || pColor}
                                    onChange={(e) => updateBlockData(idx, 'submitButtonColor', e.target.value)}
                                    className="w-7 h-7 rounded cursor-pointer border border-slate-200 bg-white"
                                  />
                                  <span className="font-mono text-[11px] text-slate-500">{block.data.submitButtonColor || pColor}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">الوصف التوضيحي للاستمارة:</label>
                              <input
                                type="text"
                                value={block.data.subtitle || ''}
                                onChange={(e) => updateBlockData(idx, 'subtitle', e.target.value)}
                                placeholder="أدخل معلوماتك أدناه وسنتصل بك هاتفياً لتأكيد إرسال الطلبية..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">نص زر تأكيد الطلب:</label>
                                <input
                                  type="text"
                                  value={block.data.submitButtonText || ''}
                                  onChange={(e) => updateBlockData(idx, 'submitButtonText', e.target.value)}
                                  placeholder="اضغط هنا للطلب الآن"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-black"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-slate-700 block mb-1">النص التوضيحي أسفل الزر:</label>
                                <input
                                  type="text"
                                  value={block.data.submitButtonSubtext || ''}
                                  onChange={(e) => updateBlockData(idx, 'submitButtonSubtext', e.target.value)}
                                  placeholder="الدفع عند الاستلام بعد معاينة المنتج 📦"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* FOOTER BLOCK SETTINGS */}
                        {block.type === 'footer' && (
                          <div className="space-y-3">
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">نص التذييل:</label>
                              <input
                                type="text"
                                value={block.data.text || ''}
                                onChange={(e) => updateBlockData(idx, 'text', e.target.value)}
                                placeholder="متجر مغربي موثوق يوفر تجربة تسوق مريحة..."
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 block mb-1">حقوق النشر (Copyright):</label>
                              <input
                                type="text"
                                value={block.data.copyrightText || ''}
                                onChange={(e) => updateBlockData(idx, 'copyrightText', e.target.value)}
                                placeholder="جميع الحقوق محفوظة"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Sticky Save Button */}
            <div className="pt-2 sticky bottom-4 z-20">
              <button
                type="button"
                onClick={handleSaveBlocksLayout}
                disabled={isSaving}
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ تخطيط وأقسام صفحة الهبوط في Firestore (Save Page Layout)</span>
              </button>
            </div>
          </div>

          {/* Real-Time Live Preview Drawer (lg:col-span-5) */}
          <div className="lg:col-span-5 sticky top-20 space-y-3">
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between shadow-sm">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>معاينة حية للمخطط في الوقت الحقيقي</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded cursor-pointer ${previewDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  title="حاسوب"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded cursor-pointer ${previewDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  title="هاتف"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className={`bg-white rounded-3xl border border-slate-200 shadow-md p-3 max-h-[750px] overflow-y-auto space-y-3 ${
              previewDevice === 'mobile' ? 'max-w-[380px] mx-auto border-4 border-slate-800' : ''
            }`}>
              {/* Header preview */}
              <div className="p-2 border-b border-slate-100 flex items-center justify-between text-xs">
                <span className="font-black text-slate-800" style={{ color: pColor }}>
                  {activeStore?.design?.logoText || activeStore?.name || 'Allio'}
                </span>
                <span className="text-[10px] text-white font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: pColor }}>
                  اطلب الآن
                </span>
              </div>

              {/* Dynamically render blocks in exact user order */}
              {blocks.filter(b => b.enabled).map((b) => {
                if (b.type === 'hero') {
                  const hHeadline = b.data.headline || (typeof activeProduct?.name === 'string' ? activeProduct.name : getLocalizedText(activeProduct?.name));
                  return (
                    <div 
                      key={b.id} 
                      className="rounded-2xl p-4 text-white text-center space-y-2 shadow-xs"
                      style={{ backgroundColor: activeStore?.design?.secondaryColor || '#0f172a' }}
                    >
                      {b.data.badgeText && (
                        <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: b.data.ctaColor || pColor }}>
                          {b.data.badgeText}
                        </span>
                      )}
                      <h4 className="font-black text-xs leading-tight">{hHeadline}</h4>
                      {b.data.subheadline && (
                        <p className="text-[10px] text-slate-300 leading-relaxed">{b.data.subheadline}</p>
                      )}
                      {b.data.ctaText && (
                        <span 
                          className="inline-block text-[11px] font-black px-3.5 py-1.5 rounded-lg text-white shadow-xs cursor-pointer"
                          style={{ backgroundColor: b.data.ctaColor || pColor }}
                        >
                          {b.data.ctaText}
                        </span>
                      )}
                    </div>
                  );
                }

                if (b.type === 'scarcity') {
                  const stockTxt = (b.data.stockText || 'بقي فقط {stock} قطع').replace('{stock}', String(activeProduct?.stockCount || 8));
                  const viewersTxt = (b.data.viewersText || '{count} زائر يتصفحون الآن').replace('{count}', '16');
                  return (
                    <div key={b.id} className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-600" />{stockTxt}</span>
                      <span className="text-slate-500">{viewersTxt}</span>
                    </div>
                  );
                }

                if (b.type === 'gallery') {
                  const imgs = b.data.images && b.data.images.length > 0 ? b.data.images : activeProduct?.images || [];
                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="h-40 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-200">
                        {imgs[0] ? (
                          <img src={imgs[0]} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-slate-400 text-[10px]">صورة المنتج</span>
                        )}
                      </div>
                    </div>
                  );
                }

                if (b.type === 'features') {
                  const feats = b.data.items || [];
                  return (
                    <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <h5 className="font-bold text-slate-900 text-[11px]">{b.data.title || 'أهم المميزات:'}</h5>
                      {feats.map((f: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-700">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{typeof f.title === 'string' ? f.title : getLocalizedText(f.title)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (b.type === 'testimonials') {
                  const tests = b.data.items || [];
                  return (
                    <div key={b.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <h5 className="font-bold text-slate-900 text-[11px]">{b.data.title || 'آراء الزبائن:'}</h5>
                      {tests.slice(0, 2).map((t: any, i: number) => (
                        <div key={i} className="p-1.5 bg-white rounded border border-slate-100 text-[10px] text-slate-600">
                          <span className="font-bold text-slate-800">{typeof t.name === 'string' ? t.name : getLocalizedText(t.name)}</span>: &quot;{typeof t.comment === 'string' ? t.comment : getLocalizedText(t.comment)}&quot;
                        </div>
                      ))}
                    </div>
                  );
                }

                if (b.type === 'guarantee') {
                  return (
                    <div key={b.id} className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs space-y-1">
                      <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{b.data.title || 'ضمان الرضا'}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{b.data.description}</p>
                    </div>
                  );
                }

                if (b.type === 'reassurances') {
                  return (
                    <div key={b.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[10px] text-slate-600">
                      {(b.data.items || []).map((it: string, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{it}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (b.type === 'order_form') {
                  return (
                    <div key={b.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                      <span className="text-[11px] font-bold text-slate-800 block text-center">
                        {b.data.title || 'استمارة الطلب السريع'}
                      </span>
                      <div className="space-y-1">
                        <div className="h-6 bg-white border border-slate-200 rounded px-2 text-[9px] text-slate-400 flex items-center">الاسم الكامل</div>
                        <div className="h-6 bg-white border border-slate-200 rounded px-2 text-[9px] text-slate-400 flex items-center">رقم الهاتف (06/07/05)</div>
                        <div className="h-6 bg-white border border-slate-200 rounded px-2 text-[9px] text-slate-400 flex items-center">المدينة</div>
                      </div>
                      <button
                        type="button"
                        className="w-full py-2 rounded-lg text-white font-black text-xs shadow-xs"
                        style={{ backgroundColor: b.data.submitButtonColor || pColor }}
                      >
                        {b.data.submitButtonText || 'اضغط هنا للطلب الآن'}
                      </button>
                    </div>
                  );
                }

                if (b.type === 'footer') {
                  return (
                    <div key={b.id} className="p-2.5 bg-slate-900 text-slate-400 text-[10px] text-center rounded-xl space-y-0.5">
                      <p>{b.data.text || 'متجر موثوق بالمغرب'}</p>
                      <p className="text-slate-500">© {new Date().getFullYear()} {b.data.copyrightText || 'جميع الحقوق محفوظة'}</p>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEVEL 2: STORE LEVEL BRANDING & CMS BUILDER */}
      {/* ===================================================================== */}
      {editorLevel === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            {/* Store Picker */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="text-xs font-bold text-slate-700 block">اختر المتجر لتخصيص هويته وشعاره وألوانه:</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.niche}) — /{s.slug}
                  </option>
                ))}
              </select>
            </div>

            {/* Colors Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>ألوان هوية المتجر (Primary & Secondary Colors)</span>
              </h3>

              {/* Primary Color */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">اللون الأساسي (أزرار الطلب والإبراز):</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{storePrimaryColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PRIMARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setStorePrimaryColor(c.value)}
                      title={c.name}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer ${
                        storePrimaryColor.toLowerCase() === c.value.toLowerCase()
                          ? 'border-slate-900 ring-2 ring-emerald-500/30 scale-105'
                          : 'border-white shadow-xs'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50">
                    <input
                      type="color"
                      value={storePrimaryColor}
                      onChange={(e) => setStorePrimaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] text-slate-500">مخصص</span>
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">اللون الثانوي (شريط الإعلانات والقوائم):</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{storeSecondaryColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SECONDARY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setStoreSecondaryColor(c.value)}
                      title={c.name}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer ${
                        storeSecondaryColor.toLowerCase() === c.value.toLowerCase()
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                          : 'border-white shadow-xs'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-0.5 bg-slate-50">
                    <input
                      type="color"
                      value={storeSecondaryColor}
                      onChange={(e) => setStoreSecondaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-[10px] text-slate-500">مخصص</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo & Favicon Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-emerald-600" />
                  <span>شعار المتجر وأيقونة التبويب (Store Logo & Favicon)</span>
                </h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setStoreLogoType('text')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      storeLogoType === 'text' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    شعار نصي
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreLogoType('image')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      storeLogoType === 'image' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    شعار مصور / أيقونة
                  </button>
                </div>
              </div>

              {logoUploadError && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-bold">
                  {logoUploadError}
                </div>
              )}

              {storeLogoType === 'text' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اسم الشعار النصي:</label>
                  <input
                    type="text"
                    value={storeLogoText}
                    onChange={(e) => setStoreLogoText(e.target.value)}
                    placeholder="Allio"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {storeLogoImageUrl ? (
                      <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <img src={storeLogoImageUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                    )}

                    <div className="flex-1 flex gap-2">
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        accept="image/*"
                        onChange={handleLogoFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>رفع صورة الشعار / الأيقونة</span>
                      </button>
                      {storeLogoImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setStoreLogoImageUrl('');
                            setStoreFaviconUrl('');
                          }}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer"
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">أو أدخل رابط الشعار مباشرة (URL):</label>
                    <input
                      type="url"
                      value={storeLogoImageUrl}
                      onChange={(e) => {
                        setStoreLogoImageUrl(e.target.value);
                        if (!storeFaviconUrl) setStoreFaviconUrl(e.target.value);
                      }}
                      placeholder="https://..."
                      dir="ltr"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">أيقونة التبويب في المتصفح (Favicon URL):</label>
                    <input
                      type="url"
                      value={storeFaviconUrl}
                      onChange={(e) => setStoreFaviconUrl(e.target.value)}
                      placeholder="اتركه فارغاً ليطابق صورة الشعار تلقائياً"
                      dir="ltr"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* Announcement */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1">شريط التنبيهات والإعلانات أعلى المتجر:</label>
                <input
                  type="text"
                  value={storeAnnouncement}
                  onChange={(e) => setStoreAnnouncement(e.target.value)}
                  placeholder="توصيل مجاني لجميع المدن المغربية 🇲🇦 والدفع نقداً عند الاستلام"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveStoreDesign}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ هوية وإعدادات المتجر في Firestore</span>
              </button>
            </div>
          </div>

          {/* Store Preview Drawer */}
          <div className="lg:col-span-5 sticky top-20 space-y-3">
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between shadow-sm">
              <span className="font-bold flex items-center gap-1.5">
                <StoreIcon className="w-4 h-4 text-emerald-400" />
                <span>معاينة واجهة المتجر</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Storefront</span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-4 space-y-3">
              {/* Header */}
              <div 
                className="p-2 text-white text-center text-[10px] font-bold rounded-lg"
                style={{ backgroundColor: storeSecondaryColor }}
              >
                {storeAnnouncement || 'توصيل مجاني لجميع مدن المغرب'}
              </div>

              <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                {storeLogoType === 'image' && storeLogoImageUrl ? (
                  <img src={storeLogoImageUrl} alt="Logo" className="h-7 w-auto object-contain" />
                ) : (
                  <span className="font-black text-sm" style={{ color: storePrimaryColor }}>
                    {storeLogoText}
                  </span>
                )}
                <span className="text-[10px] text-white font-bold px-2 py-0.5 rounded" style={{ backgroundColor: storePrimaryColor }}>
                  اطلب الآن
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${storePrimaryColor}15`, color: storePrimaryColor }}>
                  {activeStore?.niche || 'متجر متخصص'}
                </span>
                <h4 className="font-black text-xs text-slate-900">{activeStore?.name}</h4>
                <p className="text-[10px] text-slate-500">{activeStore?.description || 'تسوق براحة وأمان مع ميزة الدفع عند الاستلام'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW BLOCK SELECTOR */}
      {isAddBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">إضافة بلوك جديد لصفحة الهبوط</h3>
              </div>
              <button onClick={() => setIsAddBlockModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              اختر نوع البلوك الذي ترغب في إضافته إلى صفحة الهبوط. يمكنك إعادة ترتيبه وتخصيص محتواه في أي وقت:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
              {AVAILABLE_BLOCK_TYPES.map((b) => {
                const IconComponent = b.icon;
                return (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => handleAddNewBlock(b.type)}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-start space-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{b.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{b.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
