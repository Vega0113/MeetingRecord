import { Building2, PieChart as PieChartIcon, DollarSign, Send, TrendingUp, Wallet, Clock, CheckCircle2, Loader2, Landmark, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function PropertyOversightCard() {
  const { apiFetch } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | number>("");
  const [isSending, setIsSending] = useState(false);
  const [payoutPeriod, setPayoutPeriod] = useState("30");
  const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOversight = async () => {
      try {
        const response = await apiFetch(`/api/oversight`);
        if (response.ok) {
          const res = await response.json();
          setData(res);
          if (res.length > 0) {
            setSelectedPropertyId((prev) => {
              const exists = res.some((p: any) => String(p.id) === String(prev));
              return exists ? prev : res[0].id;
            });
          }
        }
      } catch (e) {
        console.error("監管數據對接失敗");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOversight();
  }, []);

  const [feedbackModal, setFeedbackModal] = useState<{ title: string; desc: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // 取得目前選取的標的或第一個標的作為主要顯示
  const mainProperty = data.find((p) => String(p.id) === String(selectedPropertyId)) || data[0] || { 
    id: null,
    title: "載入中...", 
    token_symbol: "RWA",
    fundraising_goal: 0, 
    payout_cycle_days: 30, 
    current_cash_balance: 0, 
    pending_rent_amount: 0 
  };

  useEffect(() => {
    if (mainProperty && mainProperty.payout_cycle_days !== undefined && mainProperty.payout_cycle_days !== null) {
      setPayoutPeriod(String(mainProperty.payout_cycle_days));
    }
  }, [mainProperty?.id, mainProperty?.payout_cycle_days]);

  const handleSendRent = async () => {
    if (!mainProperty || !mainProperty.id) {
      setFeedbackModal({ title: "操作提示", desc: "請選擇有效的房產資產", type: "warning" });
      return;
    }
    const rentAmount = parseFloat(mainProperty.pending_rent_amount || 0);
    if (rentAmount <= 0) {
      setFeedbackModal({ title: "無待發放租金", desc: `【${mainProperty.title || "此標的"}】目前沒有待發放的租金收益！`, type: "warning" });
      return;
    }

    setIsSending(true);
    try {
      const res = await apiFetch(`/api/properties/${mainProperty.id}/payout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: rentAmount }),
      });
      if (res.ok) {
        const resultData = await res.json();
        setFeedbackModal({
          title: "租金收益派發成功",
          desc: `【${mainProperty.title}】總共派發了 NT$ ${(resultData.total_distributed || rentAmount).toLocaleString()} 元給 ${resultData.recipients_count || 0} 位持倉投資人！鏈上與信託帳戶已同步清算。`,
          type: "success"
        });
        // Refresh oversight data
        const refresh = await apiFetch(`/api/oversight`);
        if (refresh.ok) setData(await refresh.json());
      } else {
        setFeedbackModal({ title: "派發失敗", desc: "無法完成租金派發，請確認後端與區塊鏈連線狀態。", type: "error" });
      }
    } catch (e) {
      console.error(e);
      setFeedbackModal({ title: "連線異常", desc: "連線伺服器失敗，請稍後重試。", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdatePeriod = async () => {
    if (!mainProperty || !mainProperty.id) {
      setFeedbackModal({ title: "操作提示", desc: "請選擇有效的房產資產", type: "warning" });
      return;
    }
    const days = parseInt(payoutPeriod);
    if (isNaN(days) || days < 1 || days > 365) {
      setFeedbackModal({ title: "設定錯誤", desc: "發放週期天數必須在 1 至 365 天之間！", type: "error" });
      return;
    }

    setIsUpdatingPeriod(true);
    try {
      const res = await apiFetch(`/api/properties/${mainProperty.id}/payout-cycle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_cycle_days: days }),
      });
      if (res.ok) {
        setFeedbackModal({
          title: "週期更新成功",
          desc: `【${mainProperty.title}】收益發放週期已成功設定為 ${days} 天，並已真實儲存至資料庫！`,
          type: "success"
        });
        // 重新同步最新監管數據
        const refresh = await apiFetch(`/api/oversight`);
        if (refresh.ok) setData(await refresh.json());
      } else {
        const errData = await res.json();
        setFeedbackModal({ title: "更新失敗", desc: errData.message || "無法更新發放週期", type: "error" });
      }
    } catch (e: any) {
      setFeedbackModal({ title: "連線異常", desc: e.message || "連線伺服器失敗，請稍後重試。", type: "error" });
    } finally {
      setIsUpdatingPeriod(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-500 ring-1 ring-slate-100 text-slate-800">
      <div className="p-6 border-b border-border bg-purple-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-purple-700 dark:text-purple-400 text-lg uppercase tracking-tight">
                房產信託資產營運
              </h3>
              <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                業務審查專區
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              信託專戶監管與收益派發核定
            </p>
          </div>
        </div>

        {/* 標的選擇選單 */}
        {data.length > 0 && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">監管標的：</span>
            <div className="relative min-w-[220px]">
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                aria-label="選擇監管房產標的"
                className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white border border-purple-200 hover:border-purple-300 rounded-xl text-xs font-black text-purple-900 outline-none focus:ring-2 focus:ring-purple-600/20 shadow-sm cursor-pointer transition-all"
              >
                {data.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.title} ({prop.token_symbol || 'RWA'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-purple-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      <div className="p-8">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center gap-4 text-slate-300 italic font-black uppercase">
             <Loader2 className="w-10 h-10 animate-spin" /> 正在同步資料庫數據...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Stats & Ownership */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground font-bold tracking-wider">標的資產規模</span>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200/60">
                    {mainProperty.title || "載入中..."}
                  </span>
                </div>
                <div className="text-5xl font-black text-slate-800 tracking-tighter">
                   ${(parseFloat(mainProperty.fundraising_goal || 0) / 10000).toLocaleString()} <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">萬 TWD</span>
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-[0.2em]">
                   <TrendingUp className="w-4 h-4 text-green-400" /> 銀行信託帳戶狀態
                 </h4>
                 <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                       <span className="text-xs font-bold text-slate-500">目前現金餘額:</span>
                       <span className="text-xl font-mono font-black text-green-400">${parseFloat(mainProperty.current_cash_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-slate-500">待發放租金:</span>
                       <span className="text-xl font-mono font-black text-blue-400">${parseFloat(mainProperty.pending_rent_amount || 0).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
              
              <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                 <p className="text-xs font-bold text-purple-800 tracking-wide">
                    資產代幣：{mainProperty.token_symbol} ｜ 收益週期：{mainProperty.payout_cycle_days || 30} 天 (定期月結)
                 </p>
              </div>
            </div>

            {/* Right: Actions & Distribution */}
            <div className="space-y-8 flex flex-col justify-center">
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-slate-800">
                     <Clock className="w-5 h-5 text-purple-600" />
                     <span className="text-sm font-black text-slate-800 uppercase tracking-tight">設定收益發放週期</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        value={payoutPeriod}
                        onChange={(e) => setPayoutPeriod(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-purple-600/10 font-black text-lg transition-all" 
                      />
                      <span className="absolute right-4 top-4.5 text-xs font-bold text-slate-400">天</span>
                    </div>
                    <button 
                      onClick={handleUpdatePeriod}
                      disabled={isUpdatingPeriod}
                      className="px-8 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isUpdatingPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      確認
                    </button>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">租金收益撥付</h4>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">定期信託收益派發</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">預計總發放額度</span>
                      <span className="text-xs font-bold text-slate-400">合規核驗</span>
                   </div>
                   <div className="text-3xl font-mono font-black text-slate-800">${parseFloat(mainProperty.pending_rent_amount || 0).toLocaleString()}</div>
                </div>

                <button 
                  onClick={handleSendRent}
                  disabled={isSending || parseFloat(mainProperty.pending_rent_amount || 0) <= 0}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-lg flex items-center justify-center gap-3 shadow-sm transition-all active:scale-95 disabled:opacity-30 uppercase tracking-wider"
                >
                  {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Landmark className="w-5 h-5" />}
                  {isSending ? "正在執行撥付..." : "執行收益發放"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部數據同步資訊 */}
      <div className="p-4 bg-slate-50 border-t border-border flex justify-center items-center gap-3">
         <div className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse delay-75" />
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse delay-150" />
         </div>
         <span className="text-[10px] font-bold text-slate-400 tracking-wider">資產與銀行信託專戶數據已即時校準</span>
      </div>

      {/* 專屬操作回饋彈窗 */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-lg border border-slate-100 animate-in zoom-in-95 text-center space-y-6">
            <div className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-white shadow-sm ${
              feedbackModal.type === 'success' ? 'bg-purple-600' :
              feedbackModal.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {feedbackModal.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-800">{feedbackModal.title}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{feedbackModal.desc}</p>
            </div>
            <button
              onClick={() => setFeedbackModal(null)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
