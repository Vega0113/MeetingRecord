import { X, Activity, Clock, AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useHeartbeat } from "../context/SystemHeartbeatContext";

interface SystemHealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: number;
  timestamp: Date;
  type: "info" | "warning" | "error" | "success";
  message: string;
  details?: string;
}

export function SystemHealthLogModal({
  isOpen,
  onClose,
}: SystemHealthLogModalProps) {
  const { apiFetch } = useAuth();
  const { tick } = useHeartbeat();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRealLogs = async () => {
    try {
      const response = await apiFetch(`/api/system-alerts`);
      if (response.ok) {
        const data = await response.json();
        // 關鍵修正：只過濾出與系統健康 (SYSTEM_HEALTH) 相關的真實日誌
        const mappedLogs = data
          .filter((item: any) => item.alert_type === 'SYSTEM_HEALTH')
          .map((item: any) => ({
            id: item.id,
            timestamp: new Date(item.created_at),
            type: item.severity === 'ERROR' ? 'error' : item.severity === 'WARNING' ? 'warning' : 'info',
            message: '核心運行指標',
            details: item.message,
          }));
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.warn("無法同步日誌");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchRealLogs();
    }
  }, [isOpen]);

  // 每 10 秒同步一次
  useEffect(() => {
    if (isOpen && tick % 10 === 0) {
      fetchRealLogs();
    }
  }, [isOpen, tick]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "error":
        return "bg-red-500/10 border-red-500/20";
      default:
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-4xl w-full mx-4 shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="flex items-center gap-2 font-semibold text-slate-800">
            <Activity className="w-5 h-5 text-green-500" />
            核心系統狀態日誌 (Real-time Audit)
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching Audit Logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm italic">尚無系統日誌紀錄</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-md border ${getLogColor(log.type)}`}
              >
                <div className="flex items-start gap-3 text-slate-800">
                  {getLogIcon(log.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black uppercase tracking-tighter">{log.message}</p>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {log.timestamp.toLocaleTimeString("zh-TW")}
                      </div>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-tighter">{log.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-black uppercase tracking-tighter">共 {logs.length} 筆真實數據紀錄</span>
            <span className="font-black uppercase tracking-tighter">每 10 秒自動同步</span>
          </div>
        </div>
      </div>
    </div>
  );
}
