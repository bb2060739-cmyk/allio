import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Save, 
  Check, 
  Palette, 
  Layout, 
  Image as ImageIcon, 
  Type, 
  ExternalLink 
} from 'lucide-react';

// ============================================================================
// 1. STATIC PRE-MADE THEMES (0 Firebase Reads - Hardcoded Presets)
// ============================================================================
const THEME_PRESETS = [
  {
    id: 'modern',
    name: 'Modern (عصري)',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    accentColor: '#059669',
    buttonColor: '#059669',
    buttonTextColor: '#ffffff'
  },
  {
    id: 'dark',
    name: 'Dark Mode (داكن فاخر)',
    backgroundColor: '#090d16',
    textColor: '#f8fafc',
    accentColor: '#10b981',
    buttonColor: '#10b981',
    buttonTextColor: '#090d16'
  },
  {
    id: 'minimal',
    name: 'Minimal (هادئ وناعم)',
    backgroundColor: '#f8fafc',
    textColor: '#334155',
    accentColor: '#2563eb',
    buttonColor: '#1e293b',
    buttonTextColor: '#ffffff'
  }
];

// Default starting sections template
const INITIAL_SECTIONS = [
  {
    id: 'sec-hero-1',
    type: 'hero',
    title: 'قسم الواجهة الترويجية (Hero)',
    headline: 'اكتشف الجودة الفائقة مع خدمة الدفع عند الاستلام',
    subheadline: 'توصيل مجاني وسريع لجميع المدن المغربية 🇲🇦 مع ضمان المعاينة قبل الأداء',
    buttonText: 'اطلب الآن - الدفع عند الاستلام',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    buttonColor: '#059669',
    buttonTextColor: '#ffffff'
  },
  {
    id: 'sec-img-text-1',
    type: 'image_with_text',
    title: 'صورة ونص (Image with Text)',
    headline: 'تصميم أنيق ومواد تصنيع ممتازة',
    subheadline: 'تم تصميم هذا المنتج بعناية فائقة ليلبي أعلى معايير الجودة والاستخدام اليومي المريح.',
    buttonText: 'شاهد المواصفات الكاملة',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    buttonColor: '#0f172a',
    buttonTextColor: '#ffffff'
  },
  {
    id: 'sec-features-1',
    type: 'features_grid',
    title: 'شبكة المميزات (Features Grid)',
    headline: 'لماذا يثق بنا آلاف الزبائن بالمغرب؟',
    subheadline: 'نوفر تجربة تسوق آمنة وسلسة خالية من أي مخاطر',
    features: [
      { id: 'f1', title: 'توصيل مجاني 100%', desc: 'إلى باب المنزل في جميع مدن المغرب' },
      { id: 'f2', title: 'الدفع عند الاستلام', desc: 'لا تدفع درهماً واحداً حتى تعاين طلبيتك' },
      { id: 'f3', title: 'ضمان الرضا والاستبدال', desc: 'إمكانية الاسترجاع أو التبديل لمدة 14 يوماً' }
    ],
    buttonText: 'تأكيد طلبي الآن',
    imageUrl: '',
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    buttonColor: '#059669',
    buttonTextColor: '#ffffff'
  }
];

export default function LandingPageBuilder({ initialData, onSavePublish }) {
  // Theme state
  const [selectedThemeId, setSelectedThemeId] = useState('modern');
  
  // Single React state object holding the entire page layout (Zero real-time syncing)
  const [layoutState, setLayoutState] = useState(() => {
    if (initialData && Array.isArray(initialData.sections) && initialData.sections.length > 0) {
      return initialData;
    }
    return {
      theme: 'modern',
      sections: INITIAL_SECTIONS,
      lastModified: new Date().toISOString()
    };
  });

  const [activeSectionId, setActiveSectionId] = useState(INITIAL_SECTIONS[0]?.id || '');
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Apply Theme Preset locally without contacting Firebase
  const handleApplyThemePreset = (preset) => {
    setSelectedThemeId(preset.id);
    setLayoutState(prev => ({
      ...prev,
      theme: preset.id,
      sections: prev.sections.map(sec => ({
        ...sec,
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
        buttonColor: preset.buttonColor,
        buttonTextColor: preset.buttonTextColor
      }))
    }));
  };

  // Reordering helpers
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setLayoutState(prev => {
      const updated = [...prev.sections];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return { ...prev, sections: updated };
    });
  };

  const handleMoveDown = (index) => {
    if (index === layoutState.sections.length - 1) return;
    setLayoutState(prev => {
      const updated = [...prev.sections];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return { ...prev, sections: updated };
    });
  };

  // Add new section
  const handleAddSection = (type) => {
    const activePreset = THEME_PRESETS.find(p => p.id === selectedThemeId) || THEME_PRESETS[0];
    const newId = `sec-${type}-${Date.now()}`;
    let newSection = {
      id: newId,
      type,
      title: type === 'hero' ? 'قسم الواجهة (Hero)' : type === 'image_with_text' ? 'صورة ونص' : 'شبكة المميزات',
      headline: 'عنوان جديد جذاب لصفحة الهبوط',
      subheadline: 'وصف تسويقي يوضح قيمة ومميزات المنتج للزبائن في المغرب...',
      buttonText: 'اضغط هنا للطلب',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      backgroundColor: activePreset.backgroundColor,
      textColor: activePreset.textColor,
      buttonColor: activePreset.buttonColor,
      buttonTextColor: activePreset.buttonTextColor
    };

    if (type === 'features_grid') {
      newSection.features = [
        { id: `f-${Date.now()}-1`, title: 'ميزة أولى حصرية', desc: 'وصف مختصر لأول ميزة للمنتج' },
        { id: `f-${Date.now()}-2`, title: 'ميزة ثانية ممتازة', desc: 'تفاصيل الميزة التنافسية الثانية' },
        { id: `f-${Date.now()}-3`, title: 'توصيل مجاني وسريع', desc: 'خدمة التوصيل السريع والدفع عند الاستلام' }
      ];
    }

    setLayoutState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setActiveSectionId(newId);
  };

  // Remove section
  const handleRemoveSection = (id) => {
    if (layoutState.sections.length <= 1) {
      alert('يجب أن تحتوي الصفحة على قسم واحد على الأقل.');
      return;
    }
    setLayoutState(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
    if (activeSectionId === id) {
      const remaining = layoutState.sections.filter(s => s.id !== id);
      setActiveSectionId(remaining[0]?.id || '');
    }
  };

  // Update section control fields
  const handleUpdateSectionField = (sectionId, field, value) => {
    setLayoutState(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s)
    }));
  };

  // Firebase-Optimized Single Save Button (Zero Auto-Save / Zero Constant Reads)
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    const finalPayload = {
      ...layoutState,
      lastModified: new Date().toISOString()
    };

    try {
      if (typeof onSavePublish === 'function') {
        await onSavePublish(finalPayload);
      } else {
        console.log('[LandingPageBuilder] Layout saved & published successfully:', finalPayload);
      }
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    } catch (err) {
      console.error('[LandingPageBuilder] Save error:', err);
      alert('حدث خطأ أثناء حفظ الصفحة.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSection = layoutState.sections.find(s => s.id === activeSectionId) || layoutState.sections[0];

  return (
    <div className="w-full min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans" dir="rtl">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              مخصص القوالب والصفحات (Theme Customizer)
            </h1>
            <p className="text-xs text-slate-500">
              تحكم بمرونة كاملة في أقسام صفحة الهبوط وتصميمها بدون أكواد
            </p>
          </div>
        </div>

        {/* Viewport & Publish Actions */}
        <div className="flex items-center gap-3">
          {/* Device Preview Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setPreviewMode('desktop')}
              title="معاينة شاشة الحاسوب"
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewMode === 'desktop' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden md:inline">حاسوب</span>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              title="معاينة شاشة الهاتف"
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewMode === 'mobile' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">هاتف</span>
            </button>
          </div>

          {/* Zero Auto-Save: Single Explicit Save & Publish Button */}
          <button
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSavedToast ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>تم النشر بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ ونشر التعديلات (Save & Publish)'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace: Sidebar Controls & Visual Preview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* =================================================================== */}
        {/* LEFT/RIGHT SIDEBAR: SECTIONS ARCHITECTURE & STYLING CONTROLS (5 cols) */}
        {/* =================================================================== */}
        <aside className="lg:col-span-5 bg-white border-l border-slate-200 flex flex-col h-full max-h-[calc(100vh-73px)] overflow-y-auto">
          {/* Static Theme Presets Selector (0 Firebase Reads) */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 space-y-2">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span>القوالب الجاهزة (Theme Presets):</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyThemePreset(preset)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    selectedThemeId === preset.id
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-2xs font-black'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section Management: Reorder & Add */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">أقسام الصفحة (Sections Order):</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddSection('hero')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  + واجهة (Hero)
                </button>
                <button
                  onClick={() => handleAddSection('image_with_text')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  + صورة ونص
                </button>
                <button
                  onClick={() => handleAddSection('features_grid')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  + مميزات
                </button>
              </div>
            </div>

            {/* List of sections with Reorder Buttons */}
            <div className="space-y-1.5">
              {layoutState.sections.map((section, index) => (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    activeSectionId === section.id
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-black shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs truncate">{section.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="تحريك لأعلى"
                      className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === layoutState.sections.length - 1}
                      title="تحريك لأسفل"
                      className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveSection(section.id)}
                      title="حذف هذا القسم"
                      className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Customization Controls Form */}
          {activeSection && (
            <div className="p-4 space-y-4 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900">
                  تعديل خصائص: {activeSection.title}
                </span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500">
                  {activeSection.type}
                </span>
              </div>

              {/* Text Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">العنوان الرئيسي (Headline):</label>
                  <input
                    type="text"
                    value={activeSection.headline || ''}
                    onChange={(e) => handleUpdateSectionField(activeSection.id, 'headline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">النص التوضيحي (Subheadline):</label>
                  <textarea
                    rows={2}
                    value={activeSection.subheadline || ''}
                    onChange={(e) => handleUpdateSectionField(activeSection.id, 'subheadline', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نص زر الإجراء (Button Text):</label>
                  <input
                    type="text"
                    value={activeSection.buttonText || ''}
                    onChange={(e) => handleUpdateSectionField(activeSection.id, 'buttonText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">رابط الصورة (Image URL):</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={activeSection.imageUrl || ''}
                    placeholder="https://..."
                    onChange={(e) => handleUpdateSectionField(activeSection.id, 'imageUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-emerald-600 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Styling Controls: Background Color, Text Color, Button Colors */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="text-xs font-black text-slate-800 block">تخصيص الألوان (Color Customization):</span>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Background Color */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">لون الخلفية (BG Hex):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeSection.backgroundColor || '#ffffff'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={activeSection.backgroundColor || '#ffffff'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'backgroundColor', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">لون النص (Text Hex):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeSection.textColor || '#0f172a'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'textColor', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={activeSection.textColor || '#0f172a'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'textColor', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Button Background Color */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">لون الزر (Button Hex):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeSection.buttonColor || '#059669'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'buttonColor', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={activeSection.buttonColor || '#059669'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'buttonColor', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Button Text Color */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">نص الزر (Btn Text Hex):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeSection.buttonTextColor || '#ffffff'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'buttonTextColor', e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={activeSection.buttonTextColor || '#ffffff'}
                        onChange={(e) => handleUpdateSectionField(activeSection.id, 'buttonTextColor', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* =================================================================== */}
        {/* RIGHT/LEFT PREVIEW PANEL: REAL-TIME VISUAL RENDER OF THE JSON STATE */}
        {/* =================================================================== */}
        <main className="lg:col-span-7 bg-slate-900/95 p-4 sm:p-8 flex justify-center items-start overflow-y-auto max-h-[calc(100vh-73px)]">
          <div
            className={`transition-all duration-300 w-full ${
              previewMode === 'mobile'
                ? 'max-w-[420px] rounded-[44px] border-8 border-slate-800 shadow-2xl bg-white overflow-hidden my-4'
                : 'max-w-4xl rounded-2xl shadow-xl bg-white overflow-hidden'
            }`}
          >
            {/* Mobile Status Bar Simulation */}
            {previewMode === 'mobile' && (
              <div className="bg-slate-900 py-1.5 px-6 flex justify-between items-center text-[10px] text-slate-400">
                <span>09:41</span>
                <div className="w-16 h-3 bg-black rounded-full" />
                <span>4G 🇲🇦</span>
              </div>
            )}

            {/* Sections Canvas rendered directly from JSON state */}
            <div className="divide-y divide-slate-100">
              {layoutState.sections.map((section) => (
                <section
                  key={section.id}
                  style={{
                    backgroundColor: section.backgroundColor || '#ffffff',
                    color: section.textColor || '#0f172a'
                  }}
                  className={`p-6 sm:p-10 transition-colors ${
                    activeSectionId === section.id ? 'ring-2 ring-emerald-500 ring-inset' : ''
                  }`}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  {/* Hero Section Layout */}
                  {section.type === 'hero' && (
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
                      <div className="flex-1 space-y-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          عرض خاص ومحدود 🔥
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                          {section.headline}
                        </h2>
                        <p className="text-xs sm:text-sm opacity-80 leading-relaxed max-w-lg mx-auto md:mx-0">
                          {section.subheadline}
                        </p>
                        {section.buttonText && (
                          <div className="pt-2">
                            <button
                              style={{
                                backgroundColor: section.buttonColor || '#059669',
                                color: section.buttonTextColor || '#ffffff'
                              }}
                              className="px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-transform hover:scale-105 cursor-pointer"
                            >
                              {section.buttonText}
                            </button>
                          </div>
                        )}
                      </div>

                      {section.imageUrl && (
                        <div className="w-full md:w-1/2 max-w-xs md:max-w-none flex justify-center">
                          <img
                            src={section.imageUrl}
                            alt="Hero Preview"
                            className="w-full h-auto max-h-72 object-contain rounded-2xl shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image with Text Layout */}
                  {section.type === 'image_with_text' && (
                    <div className="flex flex-col md:flex-row-reverse items-center gap-8 text-center md:text-right">
                      <div className="flex-1 space-y-4">
                        <h3 className="text-xl sm:text-2xl font-black">
                          {section.headline}
                        </h3>
                        <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                          {section.subheadline}
                        </p>
                        {section.buttonText && (
                          <button
                            style={{
                              backgroundColor: section.buttonColor || '#0f172a',
                              color: section.buttonTextColor || '#ffffff'
                            }}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                          >
                            {section.buttonText}
                          </button>
                        )}
                      </div>

                      {section.imageUrl && (
                        <div className="w-full md:w-1/2 flex justify-center">
                          <img
                            src={section.imageUrl}
                            alt="Preview"
                            className="w-full h-auto max-h-64 object-cover rounded-2xl shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Features Grid Layout */}
                  {section.type === 'features_grid' && (
                    <div className="space-y-6 text-center">
                      <div className="space-y-2 max-w-xl mx-auto">
                        <h3 className="text-xl sm:text-2xl font-black">{section.headline}</h3>
                        <p className="text-xs sm:text-sm opacity-80">{section.subheadline}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        {(section.features || []).map((feat, fIdx) => (
                          <div
                            key={feat.id || fIdx}
                            className="p-4 rounded-xl border border-slate-200/50 bg-white/50 text-center space-y-1.5 shadow-2xs"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold text-xs">
                              ✓
                            </div>
                            <h4 className="font-bold text-xs">{feat.title}</h4>
                            <p className="text-[11px] opacity-70">{feat.desc}</p>
                          </div>
                        ))}
                      </div>

                      {section.buttonText && (
                        <div className="pt-2">
                          <button
                            style={{
                              backgroundColor: section.buttonColor || '#059669',
                              color: section.buttonTextColor || '#ffffff'
                            }}
                            className="px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                          >
                            {section.buttonText}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
