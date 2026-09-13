import { ShieldCheck, ShieldAlert, Lock, Unlock, AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface ContractControlCardProps {
  onPauseToggle: (isPaused: boolean) => void;
  onReconcile: () => void;
  isPaused: boolean;
  isReconciling?: boolean;
}

export function ContractControlCard({ onPauseToggle, onReconcile, isPaused, isReconciling }: ContractControlCardProps) {
  return (
    <div className={`bg-white border ${isPaused ? 'border-red-500/50 bg-red-500/5' : 'border-border'} rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ring-1 ring-slate-100 transition-all duration-500`}>
      <div className={`p-6 border-b border-border ${isPaused ? 'bg-red-500/10' : 'bg-slate-50/50'} flex items-center justify-between`}>
        <h3 className="font-black flex items-center gap-2.5 text-base text-slate-800">
          {isPaused ? <Lock className="w-5 h-5 text-red-600" /> : <Unlock className="w-5 h-5 text-green-600" />}
          智能合約狀態控制
        </h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPaused ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {isPaused ? '系統已暫停' : '系統正常運作'}
        </span>
      </div>

      <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 shadow-inner ${isPaused ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {isPaused ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>

        <div className="space-y-1 mb-6">
          <h4 className={`text-xl font-black ${isPaused ? 'text-red-600' : 'text-slate-800'}`}>
            {isPaused ? '全局交易暫停中' : '系統運行正常'}
          </h4>
          <p className="text-sm text-slate-500 px-4 font-medium leading-relaxed">
            {isPaused 
              ? '當前所有鏈上交易、代幣轉移與租金分發均已暫時封鎖。' 
              : '智能合約處於活動狀態，可自由進行房產申購與交易。'}
          </p>
        </div>

        <div className="w-full pt-2 space-y-3">
          <button
            onClick={() => onPauseToggle(!isPaused)}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
              isPaused 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isPaused ? '請求解除暫停' : '強制緊急暫停'}
          </button>
          <button
            disabled={isReconciling}
            onClick={() => onReconcile()}
            className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReconciling ? (
              <><Loader2 className="w-4 h-4 animate-spin text-blue-400" /> 全節點對帳中...</>
            ) : (
              <><RefreshCw className="w-4 h-4 text-blue-400" /> 啟動全節點對帳</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
