import { ArrowUpRight, ArrowDownRight, Search, Filter, Calendar, History, Building2, Loader2, Download, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface Transaction {
  id: string;
  property_name?: string;
  property_id?: number;
  tx_type: "BUY" | "SELL";
  token_amount: string;
  price_per_token?: string;
  status: string;
  created_at: string;
}

interface InvestorTransactionsProps {
  userId: number; // 接收真實用戶 ID
}

export function InvestorTransactions({ userId }: InvestorTransactionsProps) {
  const { apiFetch } = useAuth();
  const [timeFilter, setTimeRange] = useState("今日");
  const [viewMode, setViewMode] = useState<"HISTORY" | "PENDING">("PENDING");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      setIsLoading(true);
      try {
        const [txRes, pendingRes] = await Promise.all([
          apiFetch(`/api/transactions/${userId}?t=${Date.now()}`),
          apiFetch(`/api/pending-orders?t=${Date.now()}`)
        ]);
        if (txRes.ok) {
          const data = await txRes.json();
          setTransactions(data);
        }
        if (pendingRes.ok) {
          const data = await pendingRes.json();
          setPendingOrders(data);
        }
      } catch (e) {
        console.error("交易歷史同步失敗");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTx();
  }, [userId, viewMode]);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/pending-orders/${orderId}/cancel`, { method: 'POST' });
      if (res.ok) {
        setToastMsg({ text: "已成功取消該筆委託掛單！款項與代幣已退回錢包。", type: 'success' });
        setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        const error = await res.json();
        setToastMsg({ text: error.message || "取消掛單失敗", type: 'error' });
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch (e) {
      setToastMsg({ text: "系統錯誤，請稍後重試", type: 'error' });
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const res = await apiFetch(`/api/transactions/${userId}?t=${Date.now()}`);
      if (!res.ok) throw new Error("讀取交易紀錄失敗");
      const list: any[] = await res.json();

      if (!list || list.length === 0) {
        setToastMsg({ text: "目前尚無歷史交易紀錄可供匯出", type: "error" });
        setTimeout(() => setToastMsg(null), 3500);
        return;
      }

      // 產生 CSV 格式，加入 UTF-8 BOM (\uFEFF) 防止 Excel 開啟時中文亂碼
      const headers = [
        "交易編號(ID)",
        "建案名稱",
        "建案ID",
        "交易類型",
        "委託類型",
        "代幣數量(枚)",
        "成交單價(TWD)",
        "總金額(TWD)",
        "交易狀態",
        "區塊鏈交易雜湊(txHash)",
        "交易時間"
      ];

      const csvRows = [headers.join(",")];

      for (const tx of list) {
        const amount = parseFloat(tx.token_amount || "0");
        const price = parseFloat(tx.price_per_token || "0");
        const total = (amount * price).toFixed(2);
        const typeLabel = tx.tx_type === "BUY" ? "買入" : "賣出";
        const orderTypeLabel = tx.order_type || "MARKET";
        const txHash = tx.tx_hash || "N/A";
        const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleString("zh-TW") : "N/A";
        const propName = `"${(tx.property_name || `房產 #${tx.property_id}`).replace(/"/g, '""')}"`;

        csvRows.push([
          tx.id,
          propName,
          tx.property_id,
          typeLabel,
          orderTypeLabel,
          amount,
          price,
          total,
          tx.status,
          `"${txHash}"`,
          `"${dateStr}"`
        ].join(","));
      }

      const csvString = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `RWA_交易稽核報表_UID${userId}_${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMsg({ text: `已成功匯出並下載交易稽核報表（共 ${list.length} 筆紀錄）`, type: "success" });
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e: any) {
      setToastMsg({ text: e.message || "匯出 CSV 失敗，請稍後重試", type: "error" });
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-800">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-black shadow-sm border animate-in slide-in-from-top-2 ${
          toastMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-border p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <History className="w-6 h-6" />
           </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase font-sans">交易紀錄</h2>
               <p className="text-xs font-bold text-slate-500 mt-1">用戶即時交易與撮合審計紀錄 ｜ 帳號 UID: {userId}</p>
            </div>
         </div>

         <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 font-sans">
          <button 
            onClick={() => setViewMode("PENDING")}
            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${viewMode === "PENDING" ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            當前掛單
          </button>
          <button 
            onClick={() => setViewMode("HISTORY")}
            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${viewMode === "HISTORY" ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            歷史紀錄
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-100 font-sans">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-border">
            <tr>
              <th className="px-10 py-6 text-xs font-bold text-slate-600 tracking-wider">建案名稱</th>
              <th className="px-10 py-6 text-xs font-bold text-slate-600 tracking-wider text-center">委託類型</th>
              <th className="px-10 py-6 text-xs font-bold text-slate-600 tracking-wider text-center">委託數量</th>
              <th className="px-10 py-6 text-xs font-bold text-slate-600 tracking-wider text-center">委託價格</th>
              <th className="px-10 py-6 text-xs font-bold text-slate-600 tracking-wider text-right">狀態 / 成交時間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-20 text-center">
                   <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-slate-300" />
                   <div className="text-xs font-black text-slate-400 uppercase">正在抓取資料庫紀錄...</div>
                </td>
              </tr>
            ) : viewMode === "HISTORY" ? (
              transactions.length > 0 ? transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                       <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-black text-lg text-slate-800">{tx.property_name}</span>
                  </div>
                </td>
                <td className="px-10 py-8 text-center">
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                    tx.tx_type === 'BUY' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                  }`}>
                    {tx.tx_type === 'BUY' ? '買入' : '賣出'}
                  </span>
                </td>
                <td className="px-10 py-8 text-center">
                   <div className="font-mono font-black text-lg text-slate-700">{parseFloat(tx.token_amount).toLocaleString()} 枚</div>
                </td>
                <td className="px-10 py-8 text-center">
                   <div className="font-mono font-black text-lg text-blue-600">${parseFloat(tx.price_per_token).toLocaleString()}</div>
                </td>
                <td className="px-10 py-8 text-right">
                   <div className="font-black text-sm text-slate-800">{tx.status}</div>
                   <div className="text-xs text-slate-500 font-medium mt-1 font-mono">{new Date(tx.created_at).toLocaleString()}</div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-20 text-center text-slate-300 font-black text-sm uppercase tracking-widest italic opacity-50">尚無歷史交易數據</td>
              </tr>
            )
            ) : (
              pendingOrders.length > 0 ? pendingOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                         <History className="w-5 h-5" />
                      </div>
                      <span className="font-black text-lg text-slate-800">房產 ID: {order.property_id}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                      order.tx_type === 'BUY' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {order.tx_type === 'BUY' ? '買入' : '賣出'} (限價)
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                     <div className="font-mono font-black text-lg text-slate-700">{parseFloat(order.token_amount).toLocaleString()} 枚</div>
                  </td>
                  <td className="px-10 py-8 text-center">
                     <div className="font-mono font-black text-lg text-orange-600">${parseFloat(order.price_per_token || '0').toLocaleString()}</div>
                  </td>
                  <td className="px-10 py-8 text-right">
                     <div className="font-black text-xs text-orange-500 uppercase tracking-tighter animate-pulse mb-2">等待撮合中...</div>
                     <button onClick={() => handleCancelOrder(order.id)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest transition-all">取消掛單</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300 font-black text-sm uppercase tracking-widest italic opacity-50">尚無掛單</td>
                </tr>
              )
            )}
          </tbody>
        </table>
        
        {/* Footer info */}
        <div className="p-8 bg-slate-50/50 border-t border-border flex justify-between items-center">
           <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> 所有數據已同步至 RWA-BANK POSTGRES 稽核節點
           </p>
           <button 
             onClick={handleExportCSV}
             disabled={isExporting}
             className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
           >
             {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
             {isExporting ? "正在產生報表..." : "下載完整 CSV 稽核報表"}
           </button>
        </div>
      </div>
    </div>
  );
}
