import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface OrderBookProps {
  propertyId: number;
  currentPrice: number;
  onPriceSelect?: (price: number) => void;
}

interface OrderLevel {
  price: number;
  volume: number;
  ratio?: number;
}

export function OrderBook({ propertyId, currentPrice, onPriceSelect }: OrderBookProps) {
  const { apiFetch } = useAuth();
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        const res = await apiFetch(`/api/orderbook/${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          // 計算 Ratio (視覺深度)
          let maxVol = 0;
          data.bids.forEach((b: any) => maxVol = Math.max(maxVol, b.volume));
          data.asks.forEach((a: any) => maxVol = Math.max(maxVol, a.volume));
          
          if (maxVol === 0) maxVol = 1;

          setBids(data.bids.map((b: any) => ({ ...b, ratio: Math.min(100, (b.volume / maxVol) * 100) })));
          setAsks(data.asks.map((a: any) => ({ ...a, ratio: Math.min(100, (a.volume / maxVol) * 100) })));
        }
      } catch (e) {
        // console.error(e);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 3000); // 每 3 秒更新一次五檔報價
    return () => clearInterval(interval);
  }, [propertyId, apiFetch]);

  const bidTotal = bids.reduce((acc, b) => acc + b.volume, 0);
  const askTotal = asks.reduce((acc, a) => acc + a.volume, 0);
  const total = bidTotal + askTotal;
  const bidRatio = total > 0 ? (bidTotal / total) * 100 : 50;
  const askRatio = 100 - bidRatio;

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-sm flex flex-col ring-1 ring-slate-100">
      <h3 className="font-black text-2xl mb-2 tracking-tight text-slate-800">
        市場掛單簿
      </h3>
      <p className="text-xs text-slate-400 font-medium mb-6 border-b border-slate-50 pb-4">
        市場即時掛單深度 (五檔行情)
      </p>

      <div className="mb-8 space-y-3">
        <div className="flex justify-between text-xs font-bold px-1">
          <span className="text-red-600 font-bold">委買 {bidRatio.toFixed(0)}%</span>
          <span className="text-green-600 font-bold">委賣 {askRatio.toFixed(0)}%</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.3)]" style={{ width: `${bidRatio}%` }} />
          <div className="h-full bg-green-500 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]" style={{ width: `${askRatio}%` }} />
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-500 px-1">
          <span>委買總量: {bidTotal.toLocaleString()}</span>
          <span>委賣總量: {askTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 text-center text-xs font-bold text-slate-600 border-b border-slate-100 pb-4 mb-4">
        <span>買量</span>
        <span className="col-span-2 text-slate-700">委託價格 (點選帶入)</span>
        <span>賣量</span>
      </div>

      <div className="space-y-1.5 text-slate-800">
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} className="grid grid-cols-4 items-center text-sm h-10 group">
            <div className="relative h-full flex items-center justify-start pl-3">
               <div className="absolute right-0 top-1 bottom-1 bg-red-50 rounded-l-lg transition-all border-r-2 border-red-200" style={{ width: `${bid.ratio}%` }} />
               <span className="relative z-10 font-mono font-black text-slate-600">{bid.volume}</span>
            </div>

            {/* 買價按鈕 */}
            <button 
              onClick={() => onPriceSelect?.(bid.price)}
              className="text-center font-black text-red-600 font-mono text-lg transition-all hover:scale-110 active:opacity-50 border-r border-slate-100 h-full"
            >
               {bid.price.toFixed(2)}
            </button>

            {/* 賣價按鈕 (可能沒有對應深度的 ask，因為 bids 跟 asks 長度可能不同) */}
            {asks[i] ? (
              <>
                <button 
                  onClick={() => onPriceSelect?.(asks[i].price)}
                  className="text-center font-black text-green-600 font-mono text-lg transition-all hover:scale-110 active:opacity-50 h-full"
                >
                   {asks[i].price.toFixed(2)}
                </button>

                <div className="relative h-full flex items-center justify-end pr-3">
                   <div className="absolute left-0 top-1 bottom-1 bg-green-50 rounded-r-lg transition-all border-l-2 border-green-200" style={{ width: `${asks[i].ratio}%` }} />
                   <span className="relative z-10 font-mono font-black text-slate-600">{asks[i].volume}</span>
                </div>
              </>
            ) : (
              <>
                <div className="h-full border-l border-slate-50"></div>
                <div className="h-full"></div>
              </>
            )}
          </div>
        ))}
        {/* 如果 asks 比 bids 多，繼續渲染剩下的 asks */}
        {asks.slice(bids.length).map((ask, i) => (
          <div key={`ask-${i}`} className="grid grid-cols-4 items-center text-sm h-10 group">
            <div className="h-full"></div>
            <div className="h-full border-r border-slate-100"></div>
            
            <button 
              onClick={() => onPriceSelect?.(ask.price)}
              className="text-center font-black text-green-600 font-mono text-lg transition-all hover:scale-110 active:opacity-50 h-full"
            >
               {ask.price.toFixed(2)}
            </button>

            <div className="relative h-full flex items-center justify-end pr-3">
               <div className="absolute left-0 top-1 bottom-1 bg-green-50 rounded-r-lg transition-all border-l-2 border-green-200" style={{ width: `${ask.ratio}%` }} />
               <span className="relative z-10 font-mono font-black text-slate-600">{ask.volume}</span>
            </div>
          </div>
        ))}
        
        {bids.length === 0 && asks.length === 0 && (
          <div className="text-center py-8 text-slate-400 font-bold text-xs uppercase tracking-widest italic opacity-50">
             目前無人掛單，流動性池等待注入
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
         <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <div className="flex gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-75" />
            </div>
            即時撮合中
         </div>
      </div>
    </div>
  );
}
