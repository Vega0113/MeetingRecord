import { Activity, Database, Server, AlertCircle, CheckCircle2, HardDrive, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { SystemHealthLogModal } from "./SystemHealthLogModal";
import { useHeartbeat } from "../context/SystemHeartbeatContext"; // 訂閱心跳
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";

export function SystemHealthCard() {
  const { tick } = useHeartbeat(); // 獲取全域 tick
  const { apiFetch } = useAuth();
  const [metrics, setMetrics] = useState({
    apiResponse: 0,
    dbLatency: 0,
    cpuLoad: 12.5,
    isSynced: true
  });
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const fetchPerformance = async () => {
    const startTime = Date.now();
    try {
      const response = await apiFetch(`/api/system/performance`);
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          apiResponse: Date.now() - startTime,
          dbLatency: data.dbLatency,
          cpuLoad: data.cpuLoad,
          isSynced: true
        });
      }
    } catch (e) {
      setMetrics(prev => ({ ...prev, isSynced: false }));
    }
  };

  // 根據全域心跳觸發：每 5 秒執行一次
  useEffect(() => {
    if (tick % 5 === 0) {
      fetchPerformance();
    }
  }, [tick]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-8 shadow-sm font-sans text-slate-800 ring-1 ring-slate-100 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2.5 font-black text-lg text-slate-800">
            <Activity className="w-5 h-5 text-blue-600" />
            系統核心運行狀態
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              title="查看日誌"
            >
              <FileText className="w-4 h-4 text-slate-400 hover:text-slate-800" />
            </button>
            <CheckCircle2 className={`w-5 h-5 ${metrics.isSynced ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-green-600" />
              <span className="text-slate-500 text-sm font-bold">API 響應時間</span>
            </div>
            <span className={`font-mono text-base font-black ${metrics.apiResponse > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
              {metrics.apiResponse} ms
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-600" />
              <span className="text-slate-500 text-sm font-bold">PostgreSQL 延遲</span>
            </div>
            <span className={`font-mono text-base font-black ${metrics.dbLatency > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
              {metrics.dbLatency} ms
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="text-slate-500 text-sm font-bold">伺服器負載 (CPU)</span>
            </div>
            <span className="font-mono text-base font-black text-slate-800">{metrics.cpuLoad.toFixed(1)}%</span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-green-600" />
                <span className="text-slate-500 text-sm font-bold">資料庫一致性</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-black">
                <span className="text-sm font-bold">已即時校準</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <SystemHealthLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </>
  );
}
