import React, { useEffect } from 'react';
import { Order, Product } from '../../types';
import { CheckCircle2, Truck, ShieldCheck, ArrowRight, Package, Clock } from 'lucide-react';

interface ThankYouPageProps {
  order: Order;
  product?: Product;
  onBackToHome: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  order,
  product,
  onBackToHome
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Main Success Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xl text-center space-y-5">
          {/* Animated Success Badge */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              <span>رقم الطلب: {order.orderNumber}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              شكراً لطلبكم! تم تسجيل طلبكم بنجاح
            </h1>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              شكراً لطلبكم! سنتصل بكم قريباً لتأكيد الطلب. سعداء بثقتكم في <span className="font-bold text-emerald-700">Allio</span> وسيتم تجهيز طلبيتكم فوراً للشحن.
            </p>
          </div>

          {/* Delivery Process Explainer */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-right space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>الخطوة التالية لتأكيد التوصيل:</span>
            </div>
            <div className="text-xs md:text-sm text-emerald-800 space-y-2 pr-6 border-r-2 border-emerald-300">
              <p>
                📞 <strong>مكالمة هاتفية:</strong> سيتصل بكم أحد مسؤولي خدمة الزبائن أو الموزع في مدينة <strong className="underline">{order.city}</strong> لتأكيد العنوان وموعد التسليم المناسب لكم.
              </p>
              <p>
                📦 <strong>المعاينة قبل الدفع:</strong> يحق لكم فحص المنتج والتأكد من جودته ومطابقته قبل دفع أي درهم للموزع.
              </p>
            </div>
          </div>

          {/* Itemized Order Receipt */}
          <div className="border-t border-slate-200 pt-5 text-right space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>ملخص تفاصيل الطلبية:</span>
            </h3>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs md:text-sm text-slate-700 border border-slate-200">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">اسم المنتج:</span>
                <span className="font-semibold text-slate-900">{order.productName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">الكمية:</span>
                <span className="font-semibold">{order.quantity} قطعة</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">اسم الزبون:</span>
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-mono font-bold text-emerald-800" dir="ltr">{order.phoneNumber}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">المدينة والتوصيل:</span>
                <span className="font-semibold">{order.city} (توصيل مجاني 0 درهم)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">العنوان المسجل:</span>
                <span className="font-semibold max-w-[220px] text-left truncate">{order.address}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-black text-slate-900">
                <span>المبلغ الإجمالي للدفع (COD):</span>
                <span className="text-emerald-700 text-lg font-black">{order.totalPrice} درهم</span>
              </div>
            </div>
          </div>

          {/* Tracking Pixels Confirmation Info */}
          {(product?.fbPixelId || product?.tiktokPixelId) && (
            <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 text-right">
              <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>حالة تتبع الحملة الإعلانية (Pixel Tracking):</span>
                <span className="text-emerald-600 font-bold">نشط ومرسل ✓</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                تم إرسال حدث الشراء (Purchase Event) بقيمة {order.totalPrice} درهم مغربي إلى بيكسل الإعلانات لتسجيل التحويل وموازنة تكلفة الإعلان بدقة.
              </p>
            </div>
          )}

          {/* Return button */}
          <div className="pt-2">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى الصفحة الرئيسية للمتجر</span>
            </button>
          </div>
        </div>

        {/* Reassurance Footer */}
        <div className="grid grid-cols-2 gap-3 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1.5 p-3 bg-white rounded-xl border border-slate-200">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>توصيل بالمجان لجميع المدن</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-3 bg-white rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ضمان الجودة وخدمة ما بعد البيع</span>
          </div>
        </div>
      </div>
    </div>
  );
};
