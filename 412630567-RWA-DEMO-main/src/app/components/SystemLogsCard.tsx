import { Terminal, AlertCircle, CheckCircle, Info, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { useHeartbeat } from "../context/SystemHeartbeatContext";
import { useAuth } from "../context/AuthContext";

interface LogEntry {
  id: number;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export interface SystemLogsCardHandle {
  addLog: (type: LogEntry["type"], message: string) => void;
}

export const SystemLogsCard = forwardRef<SystemLogsCardHandle>((props, ref) => {
  const { tick } = useHeartbeat();
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState({
    system: false,
    crawler: false,
    blockchain: true,
    audit: true,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await apiFetch(`/api/system-alerts`);
      if (response.ok) {
        const data = await response.json();
        // 關鍵修正：底層稽核日誌根據過濾器狀態進行動態過濾
        const mappedLogs = data
          .filter((item: any) => {
            if (item.alert_type === 'SYSTEM_HEALTH') return filters.system;
            if (item.alert_type === 'CRAWLER_REPORT') return filters.crawler;
            if (item.alert_type === 'BLOCKCHAIN') return filters.blockchain;
            // 其他皆視為操作稽核 (ORDER_MATCH, SECURITY_AUDIT 等)
            return filters.audit;
          })
          .map((item: any) => ({
            id: item.id,
            timestamp: new Date(item.created_at),
            type: item.severity === 'ERROR' ? 'error' : item.severity === 'WARNING' ? 'warning' : 'info',
            message: `[${item.alert_type}] ${item.message}`,
          }));
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.warn("無法同步日誌");
    }
  };

  // 每 5 秒執行一次日誌同步，或當過濾器變更時立即同步
  useEffect(() => {
    if (tick % 5 === 0 || true) {
      fetchLogs();
    }
  }, [tick, filters]);

  useImperativeHandle(ref, () => ({
    addLog(type: LogEntry["type"], message: string) {
      const newLog: LogEntry = { id: Date.now(), timestamp: new Date(), type, message };
      setLogs((prev) => [newLog, ...prev].slice(0, 99));
    }
  }));

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col font-sans text-slate-800 font-black transition-all">
      {/* 標題欄位與下拉展開控制項 */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className={`p-3.5 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-muted/30 transition-colors ${isExpanded ? 'border-b border-border' : ''}`}
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-800">底層核心稽核日誌 (Live Audit)</span>
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Live Sync</span>
            <span className="text-blue-300">|</span>
            <span className="font-mono">{logs.length} 筆</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
            className="flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>{isExpanded ? "收合稽核日誌" : "展開稽核日誌"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* 展開時才顯示的過濾列與黑底終端日誌區域 */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {/* 過濾工具列 */}
          <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-300">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">類型過濾：</span>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.system} 
                  onChange={() => setFilters(f => ({...f, system: !f.system}))}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span className={`text-[11px] font-bold ${filters.system ? 'text-blue-400' : 'text-slate-500'}`}>系統運行</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.crawler}
                  onChange={() => setFilters(f => ({...f, crawler: !f.crawler}))}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                />
                <span className={`text-[11px] font-bold ${filters.crawler ? 'text-purple-400' : 'text-slate-500'}`}>房產爬蟲</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.blockchain}
                  onChange={() => setFilters(f => ({...f, blockchain: !f.blockchain}))}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                <span className={`text-[11px] font-bold ${filters.blockchain ? 'text-indigo-400' : 'text-slate-500'}`}>區塊鏈</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.audit} 
                  onChange={() => setFilters(f => ({...f, audit: !f.audit}))}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-slate-800 text-green-500 focus:ring-green-500"
                />
                <span className={`text-[11px] font-bold ${filters.audit ? 'text-green-400' : 'text-slate-500'}`}>操作稽核</span>
              </label>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              即時過濾顯示：{logs.length} 筆
            </div>
          </div>

          {/* 黑色終端機區域 */}
          <div className="bg-black p-4 h-[300px] overflow-y-auto font-mono text-[11px] leading-5">
            <div className="space-y-0.5">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic p-6 text-center">暫無符合過濾條件的稽核日誌</div>
              ) : (
                logs.map((log, index) => (
                  <div key={`${log.id}-${index}`} className="flex items-start gap-2 hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                    {getLogIcon(log.type)}
                    <span className="text-gray-500 shrink-0 font-bold">[{log.timestamp.toLocaleTimeString()}]</span>
                    <span className={
                      log.type === "success" ? "text-green-400" : 
                      log.type === "warning" ? "text-yellow-400" : 
                      log.type === "error" ? "text-red-400" : "text-gray-300"
                    }>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SystemLogsCard.displayName = "SystemLogsCard";
