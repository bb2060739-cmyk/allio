import React, { useState, useEffect } from 'react';
import { PixelEventLog } from '../../types';
import { getStoredPixelEvents } from '../../lib/pixelTracker';
import { Activity, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface PixelEventDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PixelEventDebugger: React.FC<PixelEventDebuggerProps> = ({
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<PixelEventLog[]>([]);

  const loadLogs = () => {
    setLogs(getStoredPixelEvents());
  };

  useEffect(() => {
    loadLogs();
    const handleNewEvent = () => loadLogs();
    window.addEventListener('allio_pixel_event', handleNewEvent);
    return () => window.removeEventListener('allio_pixel_event', handleNewEvent);
  }, []);

  const handleClear = () => {
    localStorage.removeItem('allio_pixel_event_logs');
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white border-r border-slate-200 shadow-2xl flex flex-col text-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm">مراقب أحداث البيكسل المباشر</h3>
            <span className="text-[10px] text-slate-400">Facebook & TikTok Pixel Events</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            title="تحديث"
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            title="مسح السجل"
            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد أحداث مسجلة بعد. عند زيارة صفحة هبوط أو إرسال طلب، ستظهر أحداث البيكسل فوراً هنا.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.platform === 'facebook'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-900 text-white'
                  }`}>
                    {log.platform === 'facebook' ? 'Meta / FB' : 'TikTok'}
                  </span>
                  <span className="font-bold text-slate-900">{log.eventName}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 font-mono" dir="ltr">
                Pixel ID: {log.pixelId}
              </div>

              {log.data && Object.keys(log.data).length > 0 && (
                <pre
                  dir="ltr"
                  className="bg-slate-900 text-emerald-400 p-2 rounded-lg text-[10px] overflow-x-auto font-mono"
                >
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
