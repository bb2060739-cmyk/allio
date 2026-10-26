import React, { useState } from 'react';
import { Store, Product } from '../../types';
import { saveStore, deleteStore } from '../../lib/storage';
import { 
  Store as StoreIcon, Plus, Edit3, Trash2, ExternalLink, 
  Palette, Layers, Check, ShieldAlert, Sparkles, X, Loader2
} from 'lucide-react';

interface StoresManagerProps {
  stores: Store[];
  products: Product[];
  onStoresChange: () => void;
  onNavigateToDesign: (storeId: string) => void;
  onNavigateToLandingPages: (storeId: string) => void;
}

export const StoresManager: React.FC<StoresManagerProps> = ({
  stores,
  products,
  onStoresChange,
  onNavigateToDesign,
  onNavigateToLandingPages
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [niche, setNiche] = useState('عام');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [logoText, setLogoText] = useState('Allio');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');

  const handleOpenCreate = () => {
    setEditingStore(null);
    setName('');
    setSlug('');
    setNiche('إلكترونيات وذكاء');
    setDescription('');
    setPrimaryColor('#059669');
    setSecondaryColor('#0f172a');
    setLogoText('Allio');
    setLogoImageUrl('');
    setLogoType('text');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
    setName(store.name);
    setSlug(store.slug);
    setNiche(store.niche || 'عام');
    setDescription(store.description || '');
    setPrimaryColor(store.design?.primaryColor || '#059669');
    setSecondaryColor(store.design?.secondaryColor || '#0f172a');
    setLogoText(store.design?.logoText || store.name);
    setLogoImageUrl(store.design?.logoImageUrl || '');
    setLogoType(store.design?.logoType || 'text');
    setIsModalOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await saveStore({
        id: editingStore?.id,
        name: name.trim(),
        slug: slug.trim() || undefined,
        niche: niche.trim() || 'عام',
        description: description.trim(),
        currency: 'DH',
        design: {
          primaryColor,
          secondaryColor,
          logoType,
          logoText: logoText.trim() || name.trim(),
          logoImageUrl: logoImageUrl.trim()
        }
      });

      setStatusMessage({ type: 'success', text: `تم حفظ المتجر "${name}" بنجاح في قاعدة البيانات!` });
      onStoresChange();
      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save store:', err);
      setStatusMessage({ type: 'error', text: 'تعذر حفظ بيانات المتجر. يرجى المحاولة مجدداً.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);

    try {
      const ok = await deleteStore(storeToDelete.id);
      if (ok) {
        setStatusMessage({ type: 'success', text: `تم حذف المتجر "${storeToDelete.name}" بنجاح!` });
        onStoresChange();
        setStoreToDelete(null);
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: 'لا يمكن حذف المتجر الرئيسي الافتراضي.' });
      }
    } catch (err) {
      console.error('Failed to delete store:', err);
      setStatusMessage({ type: 'error', text: 'فشل حذف المتجر من Firestore.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-emerald-600" />
            <span>إدارة المتاجر والنيشات المتعددة (Multi-Store Architecture)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            يمكنك إنشاء وإدارة عدة متاجر متخصصة (مثل الإلكترونيات، الصحة والجمال، المطبخ، الأزياء) 
            مع ربط صفحات الهبوط الخاصة بكل متجر وتخصيص هوية التصميم والألوان لكل نيش بشكل مستقل.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ إنشاء متجر / نيش جديد</span>
        </button>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stores.map((store) => {
          const linkedProducts = products.filter(p => p.storeId === store.id || (!p.storeId && store.id === 'store-default'));
          const pColor = store.design?.primaryColor || '#059669';

          return (
            <div 
              key={store.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Store Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: pColor }}
                    >
                      {store.design?.logoType === 'image' && store.design.logoImageUrl ? (
                        <img src={store.design.logoImageUrl} alt="logo" className="w-7 h-7 object-contain" />
                      ) : (
                        <span>{(store.design?.logoText || store.name || 'A').slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{store.name}</h3>
                        {store.isDefault && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            رئيسي
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400 block" dir="ltr">/{store.slug}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                    {store.niche}
                  </span>
                </div>

                {/* Description */}
                {store.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {store.description}
                  </p>
                )}

                {/* Metrics & Design Indicators */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">صفحات الهبوط</span>
                    <button 
                      onClick={() => onNavigateToLandingPages(store.id)}
                      className="font-bold text-slate-800 hover:text-emerald-600 flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{linkedProducts.length} صفحة</span>
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">لون الهوية البصري</span>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-700">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: pColor }} />
                      <span>{pColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigateToDesign(store.id)}
                  title="تخصيص الألوان والشعار والمظهر"
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>محرر التصميم</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(store)}
                  title="تعديل بيانات المتجر"
                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {!store.isDefault && (
                  <button
                    onClick={() => setStoreToDelete(store)}
                    title="حذف المتجر"
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Store */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingStore ? 'تعديل بيانات المتجر / النيش' : 'إنشاء متجر / نيش جديد'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المتجر / النيش *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Allio Tech أو متجر العناية الطبيعية"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingStore) {
                      setSlug(e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 bg-slate-50 focus:bg-white transition-all text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرابط الفريد (Slug)</label>
                  <input
                    type="text"
                    placeholder="مثال: tech أو beauty"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600 bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">النيش / التخصص</label>
                  <input
                    type="text"
                    placeholder="مثال: إلكترونيات، تجميل، ديكور"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف المتجر (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="نبذة تسويقية مختصرة عن المتجر وما يقدمه للزبائن..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-600 bg-slate-50 text-xs leading-relaxed"
                />
              </div>

              {/* Quick Brand Style Initializer */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="font-bold text-slate-700 block text-xs">الألوان والشعار المبدئي:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block mb-1">اللون الأساسي (Primary):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        dir="ltr"
                        className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1">اسم الشعار (Logo Text):</label>
                    <input
                      type="text"
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      placeholder="Allio"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingStore ? 'تحديث المتجر' : 'حفظ وإنشاء المتجر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">تأكيد حذف المتجر</h3>
              <p className="text-xs text-slate-500">
                هل أنت متأكد من حذف المتجر &quot;{storeToDelete.name}&quot;؟ سيتم فك ارتباط أي صفحات هبوط تابعة له ونقلها للمتجر الافتراضي.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStoreToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={handleDeleteStore}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>حذف نهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
