import React from 'react';
import { ShoppingBag, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDynamicHead } from '../../utils/dynamicHead';

interface ProductNotFoundProps {
  slug?: string;
}

export const ProductNotFound: React.FC<ProductNotFoundProps> = ({ slug }) => {
  useDynamicHead({
    title: '404 — الصفحة غير متوفرة | Allio',
    storeName: 'Allio'
  });
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-5">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <ShoppingBag className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">
            صفحة المنتج غير متوفرة
          </h1>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            الرابط المطلوب <span className="font-mono text-emerald-700 font-bold" dir="ltr">/{slug || ''}</span> غير مسجل أو ربما انتهت صلاحية العرض الخاص به.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>تصفح المنتجات المتوفرة بالمتجر العام</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
