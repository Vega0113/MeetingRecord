import React from "react";
import { X, ExternalLink, MapPin, Building2, TrendingUp, ShieldCheck, Coins, Copy, Check, Info, FileText } from "lucide-react";
import { useState } from "react";

interface PropertyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: number;
    name: string;
    addr?: string;
    complete_address?: string;
    price: number;
    img?: string;
    main_image?: string;
    city_tag?: string;
    location?: string;
    total_supply?: number;
    total_supply_x?: number;
    total_value?: number;
    fundraising_goal?: number;
    payout_cycle_days?: number;
    size_ping?: number;
    token_address?: string;
    token_symbol?: string;
  } | null;
}

export function PropertyInfoModal({ isOpen, onClose, property }: PropertyInfoModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !property) return null;

  const title = property.name || "房產建案資訊";
  const address = property.complete_address || property.addr || "台北市精華地段";
  const city = property.location || property.city_tag || "台北市";
  const image = property.main_image || property.img || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800";
  const cycleDays = property.payout_cycle_days || 30;
  const totalSupply = property.total_supply || property.total_supply_x || 100000;
  const currentPrice = property.price || 189.7;
  const totalValue = property.fundraising_goal || property.total_value || (currentPrice * totalSupply);
  const tokenAddress = property.token_address || "0x95401dc811bb5740090279ba06cfa8fcf6113778";
  const tokenSymbol = property.token_symbol || "RWA";
  const source591Url = `https://newhouse.591.com.tw/${property.id}`;

  // 真實規劃坪數與每坪單價
  const sizePing = property.size_ping ? parseFloat(String(property.size_ping)) : 35.0;
  const unitPriceWan = sizePing > 0 ? Math.round((totalValue / sizePing / 10000) * 10) / 10 : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-900">
          <img src={image} alt={title} className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-600/90 text-white rounded-lg text-xs font-black tracking-wider uppercase backdrop-blur">
                {city}
              </span>
              <span className="px-3 py-1 bg-emerald-500/90 text-white rounded-lg text-xs font-black tracking-wider uppercase backdrop-blur flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ERC-3643 認證
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* 地址 */}
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">基地完整地址</div>
              <div className="text-sm font-bold text-slate-800">{address}</div>
            </div>
          </div>

          {/* 房產核心規格 4 格網格 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-xs font-bold text-slate-500 mb-1">規劃坪數</div>
              <div className="text-lg font-black text-slate-800">{sizePing} 坪</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-xs font-bold text-slate-500 mb-1">實體每坪單價</div>
              <div className="text-lg font-black text-blue-600">{unitPriceWan} 萬/坪</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-xs font-bold text-slate-500 mb-1">收益發放週期</div>
              <div className="text-lg font-black text-emerald-600">{cycleDays} 天 (定期)</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-xs font-bold text-slate-500 mb-1">總銷估值</div>
              <div className="text-lg font-black text-slate-800">{(totalValue / 10000).toLocaleString()} 萬</div>
            </div>
          </div>

          {/* 代幣化與風控規則 */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100/60 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
              <Coins className="w-4 h-4 text-blue-600" /> 代幣化與投資風控規範
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between p-2.5 bg-white/80 rounded-xl border border-blue-100/40">
                <span className="text-slate-600 font-bold">總發行量</span>
                <span className="font-mono font-black text-slate-800">{totalSupply.toLocaleString()} {tokenSymbol}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-white/80 rounded-xl border border-blue-100/40">
                <span className="text-slate-600 font-bold">單一帳戶持倉上限</span>
                <span className="font-mono font-black text-blue-600">5,000 份額 (5.0%)</span>
              </div>
              <div className="flex justify-between p-2.5 bg-white/80 rounded-xl border border-blue-100/40">
                <span className="text-slate-600 font-bold">定價機制</span>
                <span className="font-bold text-slate-800">AMM 動態做市 ($x \cdot y = k$)</span>
              </div>
              <div className="flex justify-between p-2.5 bg-white/80 rounded-xl border border-blue-100/40">
                <span className="text-slate-600 font-bold">合規標準</span>
                <span className="font-bold text-slate-800">ERC-3643 (T-REX v4)</span>
              </div>
            </div>

            {/* 智能合約地址 */}
            <div className="pt-1">
              <div className="text-xs font-bold text-slate-500 mb-1">智能合約地址 (Token Contract)</div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-100">
                <span className="font-mono text-xs text-slate-600 truncate flex-1">{tokenAddress}</span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "已複製" : "複製"}
                </button>
              </div>
            </div>
          </div>

          {/* 外部 591 來源驗證 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0 font-black text-sm">
                591
              </div>
              <div className="text-xs">
                <div className="font-black text-slate-800">外部預言機資料來源</div>
                <div className="text-slate-500 font-medium">資料由 Python 爬蟲定期自 591 新建案同步</div>
              </div>
            </div>
            <a
              href={source591Url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              開啟 591 原始建案 <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            關閉詳細資訊
          </button>
        </div>
      </div>
    </div>
  );
}
