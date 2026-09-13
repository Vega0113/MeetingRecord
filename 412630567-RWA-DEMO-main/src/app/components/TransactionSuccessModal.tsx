import { X, CheckCircle2, ArrowRight, ShieldCheck, ExternalLink, Share2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "BUY" | "SELL";
  orderType: "market" | "limit"; // 新增：判斷是市價還是限價
  tokenAmount: string;
  price: number;
  propertyName: string;
}

export function TransactionSuccessModal({ isOpen, onClose, type, orderType, tokenAmount, price, propertyName }: TransactionSuccessModalProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalValue = (parseFloat(tokenAmount || "0") * price).toLocaleString();
  const isLimit = orderType === "limit";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[250] p-4 backdrop-blur-xl">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/20 max-w-md w-full shadow-2xl overflow-hidden transition-all duration-700 transform ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        
        <div className={`absolute top-0 left-0 w-full h-2 ${isLimit ? 'bg-blue-500' : (type === 'BUY' ? 'bg-red-500' : 'bg-green-500')}`} />
        
        <div className="p-8 pt-10 text-center space-y-6 text-slate-800">
          <div className="relative mx-auto w-20 h-20">
            <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-white shadow-sm ${isLimit ? 'bg-blue-600' : (type === 'BUY' ? 'bg-red-600' : 'bg-green-600')}`}>
              {isLimit ? <Clock className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {isLimit ? "委託已送出" : (type === "BUY" ? "申購成功" : "委賣成功")}
            </h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed">
              {isLimit ? "已進入撮合佇列，等待對手盤成交" : "交易已由區塊鏈智能合約完成即時清算"}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 text-left border border-slate-100 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">標的資產</span>
                <span className="text-sm font-black text-slate-700">{propertyName}</span>
             </div>
             <div className="h-px bg-slate-200/50" />
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">數量</span>
                <span className={`text-xl font-mono font-black ${type === 'BUY' ? 'text-red-600' : 'text-green-600'}`}>
                   {type === 'BUY' ? '+' : '-'}{tokenAmount} <span className="text-xs">枚</span>
                </span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">{isLimit ? '預估總值' : '結算總額'}</span>
                <span className="text-lg font-mono font-black text-blue-600">${totalValue} <span className="text-xs">TWD</span></span>
             </div>
          </div>

          {isLimit && (
            <p className="text-xs text-blue-600 font-bold">
               您可以在「當前委託」中查看掛單狀態
            </p>
          )}

          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
          >
            完成並返回
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-800">
           <ShieldCheck className="w-4 h-4 text-emerald-500" />
           <span className="text-xs font-bold text-slate-400 tracking-wider">銀行信託與合規智能合約保障</span>
        </div>
      </div>
    </div>
  );
}
