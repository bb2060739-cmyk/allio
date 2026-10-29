import React, { useState } from 'react';
import { Product, Store } from '../../types';
import { deleteProduct } from '../../lib/storage';
import { getLocalizedText } from '../../utils/i18n';
import { 
  Plus, ExternalLink, Edit3, Trash2, Copy, 
  Check, Loader2, AlertTriangle, ShieldAlert, Database, X,
  Store as StoreIcon, Palette, Filter
} from 'lucide-react';

interface LandingPagesManagerProps {
  products: Product[];
  stores: Store[];
  onProductsChange: () => void;
  onOpenCreateModal: () => void;
  onEditProduct: (product: Product) => void;
  onViewLandingPage: (product: Product) => void;
  onCustomizeDesign: (product: Product) => void;
  onOpenSettingsModal?: (product: Product) => void;
}

export const LandingPagesManager: React.FC<LandingPagesManagerProps> = ({
  products,
  stores,
  onProductsChange,
  onOpenCreateModal,
  onEditProduct,
  onViewLandingPage,
  onCustomizeDesign,
  onOpenSettingsModal
}) => {
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const filteredProducts = selectedStoreFilter === 'all' 
    ? products 
    : products.filter(p => p.storeId === selectedStoreFilter || (!p.storeId && selectedStoreFilter === 'store-default'));

  const handleOpenDeleteConfirm = (product: Product) => {
    setDeleteSuccessMessage(null);
    setDeleteErrorMessage(null);
    setProductToDelete(product);
  };

  const handleExecuteDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    const docId = productToDelete.id;
    console.log(`[Admin] Initiating permanent Firebase deletion for docId: ${docId}`);

    try {
      const success = await deleteProduct(docId);
      if (success) {
        setDeleteSuccessMessage(`تم حذف المنتج "${getLocalizedText(productToDelete.name)}" (ID: ${docId}) نهائياً من قاعدة بيانات Firebase Firestore.`);
        onProductsChange();
        setProductToDelete(null);
        setTimeout(() => setDeleteSuccessMessage(null), 4000);
      } else {
        setDeleteErrorMessage(`فشل حذف المستند (${docId}) من Firestore. المرجو المحاولة مجدداً.`);
      }
    } catch (err) {
      console.error('Failed to execute delete on Firestore:', err);
      setDeleteErrorMessage(`حدث خطأ أثناء الاتصال بقاعدة البيانات: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Messages */}
      {deleteSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setDeleteSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {deleteErrorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{deleteErrorMessage}</span>
          </div>
          <button 
            onClick={() => setDeleteErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Action Header with Store Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">
              صفحات الهبوط المباشرة (Landing Pages)
            </h2>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'صفحة' : 'صفحات'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            صفحات فائقة السرعة مخزنة سحابياً في Firebase Firestore مع بيكسل التتبع واستمارة الدفع عند الاستلام
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Store / Niche Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-bold text-slate-600">المتجر:</span>
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">جميع المتاجر ({products.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({products.filter(p => p.storeId === s.id || (!p.storeId && s.id === 'store-default')).length})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إنشاء صفحة منتج جديدة</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">لا توجد صفحات هبوط في هذا المتجر</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              لم يتم إنشاء أي صفحة هبوط تابعة لهذا المتجر بعد. يمكنك إضافة صفحة منتج جديدة أو اختيار متجر آخر من القائمة.
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول صفحة هبوط</span>
          </button>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const linkedStore = stores.find(s => s.id === product.storeId) || stores[0];
          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Cover */}
                <div className="relative bg-slate-50 border-b border-slate-100 overflow-hidden p-3 min-h-[190px] flex items-center justify-center">
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'}
                    alt={getLocalizedText(product.name)}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[180px] object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Store Badge */}
                  <span 
                    className="absolute top-2.5 right-2.5 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1"
                    style={{ backgroundColor: linkedStore?.design?.primaryColor || '#059669' }}
                  >
                    <StoreIcon className="w-3 h-3" />
                    <span>{linkedStore?.name || 'Allio'}</span>
                  </span>

                  <span className="absolute bottom-2.5 left-2.5 bg-slate-900/90 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                    {product.price} درهم DH
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1" title={getLocalizedText(product.name)}>
                      {getLocalizedText(product.name)}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {getLocalizedText(product.shortDescription)}
                    </p>
                  </div>

                  {/* Public Link Bar */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium">الرابط الفريد لصفحة الهبوط:</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 truncate" dir="ltr">
                        allio.shop/{product.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyLink(product.slug)}
                        title="نسخ الرابط المباشر للحملة"
                        className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        {copiedSlug === product.slug ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Firestore Doc ID Tag & Pixels Status */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100/70 border border-slate-200 px-2 py-1 rounded-lg">
                      <Database className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-slate-400 font-semibold">Firebase ID:</span>
                      <span className="font-mono text-slate-700 truncate" dir="ltr" title={product.id}>
                        {product.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                        product.fbPixelId
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <span>FB Pixel:</span>
                        <strong>{product.fbPixelId ? 'مربوط ✓' : 'غير مفعل'}</strong>
                      </span>

                      <span className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                        product.tiktokPixelId
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <span>TikTok:</span>
                        <strong>{product.tiktokPixelId ? 'مربوط ✓' : 'غير مفعل'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">السعر</span>
                      <span className="font-bold text-slate-800">{product.price} DH</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المبيعات</span>
                      <span className="font-bold text-emerald-700">{product.salesCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">المخزون</span>
                      <span className="font-bold text-slate-800">{product.stockCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onCustomizeDesign(product)}
                  title="فتح محرر البلوكات المرئي وتعديل الأقسام والتصميم"
                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل الصفحة (Page Builder)</span>
                </button>

                <button
                  onClick={() => onViewLandingPage(product)}
                  title="معاينة الصفحة الحية كزبون"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenSettingsModal ? onOpenSettingsModal(product) : onEditProduct(product)}
                  title="إعدادات الصفحة (السعر، المخزون، والبيكسل)"
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenDeleteConfirm(product)}
                  title={`حذف الصفحة نهائياً من قاعدة البيانات (ID: ${product.id})`}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-App Permanent Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  تأكيد حذف صفحة الهبوط نهائياً
                </h3>
                <p className="text-xs text-slate-500">
                  هل أنت متأكد من رغبتك في حذف هذا المنتج من متجر allio؟
                </p>
              </div>
            </div>

            {/* Target Product & Firebase Document Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">اسم المنتج:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]" title={getLocalizedText(productToDelete.name)}>
                  {getLocalizedText(productToDelete.name)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">الرابط المباشر:</span>
                <span className="font-mono text-emerald-700 font-semibold" dir="ltr">
                  /{productToDelete.slug}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Firebase Document ID المستهدف:</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    متحقق منه ✓
                  </span>
                </div>
                <div className="font-mono text-[11px] bg-white border border-slate-200 p-2 rounded-xl text-slate-800 break-all select-all font-bold" dir="ltr">
                  {productToDelete.id}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
              ⚠️ <strong>حذف نهائي:</strong> سيتم تنفيذ أمر <code className="font-mono bg-rose-100 px-1 rounded">deleteDoc()</code> على قاعدة بيانات Firebase Firestore وحذف المستند نهائياً. لن يعود هذا المنتج للظهور مجدداً حتى بعد إعادة تحميل الصفحة.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الحذف من Firebase...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف نهائي من قاعدة البيانات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
