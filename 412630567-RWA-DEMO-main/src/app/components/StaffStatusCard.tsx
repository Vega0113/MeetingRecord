import { MessageSquare, User, ShieldCheck, Clock, AlertTriangle, Send, Cpu } from "lucide-react";
import { RequestType } from "../App";

interface StaffStatusCardProps {
  onOpenChat: () => void;
  hasRequest?: boolean;
  isBankerView?: boolean;
  unreadCount?: number;
  userName?: string;
  requestType?: RequestType; // 新增：請求類型
}

export function StaffStatusCard({ onOpenChat, hasRequest = false, isBankerView = false, unreadCount = 0, userName, requestType }: StaffStatusCardProps) {
  
  // 根據請求類型決定按鈕顏色
  const getButtonColor = () => {
    if (!hasRequest) return isBankerView ? 'bg-purple-600' : 'bg-blue-600';
    if (isBankerView) return 'bg-purple-600';
    
    // 技術端且有請求時
    if (requestType === "PAUSE_REQUEST") return 'bg-red-600 animate-pulse';
    if (requestType === "UNPAUSE_REQUEST") return 'bg-yellow-500 text-slate-900'; // 恢復請求用黃色
    return 'bg-red-600';
  };

  return (
    <div className={`bg-white border ${hasRequest ? (requestType === 'PAUSE_REQUEST' ? 'border-red-500' : 'border-yellow-500') : 'border-border'} rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ring-1 ring-slate-100 transition-all duration-300 h-full`}>
      <div className={`p-6 border-b border-border ${hasRequest ? (requestType === 'PAUSE_REQUEST' ? 'bg-red-500/10' : 'bg-yellow-500/10') : 'bg-slate-50/50'} flex items-center justify-between`}>
        <h3 className="font-black flex items-center gap-2 text-base text-slate-800">
          {isBankerView ? <ShieldCheck className="w-5 h-5 text-purple-600" /> : <Cpu className="w-5 h-5 text-blue-600" />}
          {isBankerView ? '業務端值班人員' : '技術端負責人'}
        </h3>
        <span className={`flex items-center gap-1.5 text-xs font-bold ${hasRequest ? (requestType === 'PAUSE_REQUEST' ? 'text-red-500' : 'text-yellow-600') : 'text-green-500'} uppercase`}>
          <span className={`w-2 h-2 rounded-full ${hasRequest ? (requestType === 'PAUSE_REQUEST' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500') : 'bg-green-500'}`} />
          {hasRequest ? '請求處理中' : '連線正常'}
        </span>
      </div>
      
      <div className="p-8 flex-1 flex flex-col items-center text-center text-slate-800">
        <div className="relative mb-4">
          <div className={`w-20 h-20 rounded-full ${isBankerView ? 'bg-purple-500/10 border-purple-500/20' : 'bg-blue-500/10 border-blue-200' } border-2 flex items-center justify-center`}>
            <User className={`w-10 h-10 ${isBankerView ? 'text-purple-600' : 'text-blue-600'}`} />
          </div>
          {hasRequest && !isBankerView && (
            <div className={`absolute -top-1 -right-1 ${requestType === 'PAUSE_REQUEST' ? 'bg-red-600' : 'bg-yellow-500'} text-white p-1.5 rounded-full shadow-sm`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        
        <div className="mb-5">
          <div className="font-black text-2xl tracking-tight text-slate-800">{userName || (isBankerView ? '陳政齊' : '廖偉哲')}</div>
          <div className="text-xs font-bold text-slate-600 mt-1.5 bg-slate-100 px-3.5 py-1 rounded-xl inline-block border border-slate-200">
            {isBankerView ? '審查業務組' : '技術工程組'}
          </div>
        </div>

        <div className="w-full space-y-3 mt-auto relative">
          <div className={`p-3 rounded-xl text-xs text-left border ${hasRequest && requestType === 'UNPAUSE_REQUEST' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-slate-50 border-slate-200 text-slate-600'} leading-relaxed font-bold`}>
            {isBankerView 
              ? (hasRequest ? '異常請求授權中...' : '當前業務正常。點擊下方開啟通訊頻道。')
              : (hasRequest ? (requestType === 'PAUSE_REQUEST' ? '警報：收到緊急暫停請求！' : '提醒：業務端請求恢復系統交易。') : '系統監控中，隨時可接收跨部門請求。')}
          </div>
          
          <div className="relative">
            <button 
              onClick={onOpenChat}
              className={`w-full py-3.5 ${getButtonColor()} rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-white`}
            >
              <MessageSquare className="w-4 h-4" />
              處理訊息
            </button>

            {unreadCount > 0 && (
              <div className={`absolute -top-2 -right-2 ${requestType === 'UNPAUSE_REQUEST' ? 'bg-blue-600' : 'bg-red-500'} text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-card shadow-lg`}>
                {unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
