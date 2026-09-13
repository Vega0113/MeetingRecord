import { Bell, CheckCircle2, TrendingUp, TrendingDown, X, Building2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useHeartbeat } from "../context/SystemHeartbeatContext";
import { useAuth } from "../context/AuthContext";

export function NotificationCenter({ userId }: { userId: number }) {
  const { tick } = useHeartbeat();
  const { apiFetch } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch(`/api/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("無法同步通知數據");
    }
  };

  // 每 3 秒同步一次通知 (滿足即時性要求)
  useEffect(() => {
    if (tick % 3 === 0) {
      fetchNotifications();
    }
  }, [tick]);

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/notifications/${userId}/read`, { method: 'PATCH' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error("標記已讀失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative font-sans text-slate-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-muted/50 rounded-xl hover:bg-slate-200 transition-all relative group"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-blue-600 animate-swing' : 'text-slate-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-96 bg-white border border-border rounded-2xl shadow-lg z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-border bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-slate-800 tracking-wider">通知中心</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg font-bold">即時推播</span>
               </div>
               <button 
                onClick={handleMarkAllRead} 
                disabled={isLoading || unreadCount === 0}
                className="text-[10px] font-black text-blue-600 hover:underline disabled:text-slate-300"
               >
                 {isLoading ? "處理中..." : "全部標記已讀"}
               </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 text-slate-800">
               {notifications.length > 0 ? notifications.map(n => (
                 <div key={n.id} className={`p-6 hover:bg-slate-50 transition-colors flex gap-4 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.title.includes('買') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                       {n.title.includes('買') ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between items-start text-slate-800">
                          <p className="font-black text-sm leading-none">{n.title}</p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                       <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                    </div>
                 </div>
               )) : (
                 <div className="p-20 text-center text-slate-300">
                    <Bell className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <div className="font-black text-xs uppercase tracking-widest">目前尚無系統通知</div>
                 </div>
               )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-border text-center text-xs font-bold text-slate-400">
               即時通知推播連線中
            </div>
          </div>
        </>
      )}
    </div>
  );
}
