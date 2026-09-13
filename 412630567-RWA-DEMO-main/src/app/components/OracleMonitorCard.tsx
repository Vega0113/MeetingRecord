import { Activity, Database, Server, AlertCircle, CheckCircle2, HardDrive, FileText, Search, ShieldCheck, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { OracleMonitorLogModal } from "./OracleMonitorLogModal";
import { useHeartbeat } from "../context/SystemHeartbeatContext";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";

export function OracleMonitorCard() {
  const { tick } = useHeartbeat();
  const { apiFetch } = useAuth();
  const [metrics, setMetrics] = useState({
    lastRunAt: new Date(),
    failures: 0,
    integrity: 100,
    status: "HEALTHY"
  });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const fetchCrawlerStatus = async () => {
    try {
      const response = await apiFetch(`/api/system/crawler-status`);
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          lastRunAt: new Date(data.last_run_at),
          failures: data.consecutive_failures,
          integrity: parseFloat(data.average_integrity),
          status: data.status
        });
      }
    } catch (e) {
      console.error("無法同步爬蟲狀態");
    }
  };

  // 每 5 秒同步一次，與健康度卡片對齊
  useEffect(() => {
    if (tick % 5 === 0) {
      fetchCrawlerStatus();
    }
  }, [tick]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 0) return "剛剛";
    return diffSec < 60 ? `${diffSec} 秒前` : `${Math.floor(diffSec / 60)} 分鐘前`;
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-8 shadow-sm font-sans text-slate-800 ring-1 ring-slate-100 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6 text-slate-800">
          <h2 className="flex items-center gap-2.5 font-black text-lg text-slate-800">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            房產數據監控 (591)
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              title="查看日誌"
            >
              <FileText className="w-4 h-4 text-slate-400 hover:text-slate-800" />
            </button>
            <CheckCircle2 className={`w-5 h-5 ${metrics.status === 'HEALTHY' ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
        </div>

        <div className="space-y-4 text-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-green-600" />
              <span className="text-slate-500 text-sm font-bold">591 爬蟲狀態</span>
            </div>
            <span className={`font-black text-sm ${metrics.status === 'HEALTHY' ? 'text-green-600' : 'text-yellow-600'}`}>
               {metrics.status === 'HEALTHY' ? '運作正常' : '需要注意'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <span className="text-slate-500 text-sm font-bold">最後成功執行</span>
            </div>
            <span className="font-mono font-bold text-sm text-slate-700">{formatTime(metrics.lastRunAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-green-600" />
              <span className="text-slate-500 text-sm font-bold">連線失敗次數</span>
            </div>
            <span className={`font-mono font-bold text-sm ${metrics.failures > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.failures} / 5
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="text-slate-500 text-sm font-bold">數據完整度</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-black text-lg ${metrics.integrity < 95 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {metrics.integrity.toFixed(1)}%
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <OracleMonitorLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </>
  );
}
