import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { OrderBook } from "./OrderBook";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { OrderEntryForm } from "./OrderEntryForm";
import { KLineChart } from "./KLineChart";
import { PropertyInfoModal } from "./PropertyInfoModal";

interface PropertyDetailProps {
  userId: number;
  property: any;
  userProfile?: any;
  onBack: () => void;
}

export function InvestorPropertyDetail({ userId, property, userProfile, onBack }: PropertyDetailProps) {
  const { apiFetch } = useAuth();
  const [vLogs, setVLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [selectedOrderPrice, setSelectedOrderPrice] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // 修正 #6: 使用 local state 來同步即時價格與數量
  const [livePrice, setLivePrice] = useState(property.price);
  const [liveSupply, setLiveSupply] = useState(property.circulating_supply || 0);
  
  // 確保當外部傳入的真實資料庫價格變更時，livePrice 會同步更新
  useEffect(() => {
    setLivePrice(property.price);
    setLiveSupply(property.circulating_supply || 0);
  }, [property]);
  
  const [marketStats, setMarketStats] = useState({ high: property.price.toFixed(2), low: property.price.toFixed(2), vol: "0" });

  useEffect(() => {
    const fetchLogs = async () => {
        try {
          const [klineRes, statsRes, propsRes] = await Promise.all([
            apiFetch(`/api/properties/${property.id}/kline`),
            apiFetch(`/api/stats/${property.id}`),
            apiFetch(`/api/properties`)
          ]);
          
          if (klineRes.ok) {
            const res = await klineRes.json();
            setVLogs(res);
          }
          if (statsRes.ok) {
            const stats = await statsRes.json();
            setMarketStats({
              high: (stats.high || property.price).toFixed(2),
              low: (stats.low || property.price).toFixed(2),
              vol: stats.volume ? stats.volume.toLocaleString() : "0"
            });
          }
          if (propsRes.ok) {
            const allProps = await propsRes.json();
            const updatedProp = allProps.find((p: any) => p.id === property.id);
            if (updatedProp) {
              setLivePrice(updatedProp.current_price || updatedProp.price);
              setLiveSupply(updatedProp.circulating_supply || 0);
            }
          }
        } catch (e) { console.error("Logs sync failed"); } finally { setIsLoadingLogs(false); }
    };
    fetchLogs();
  }, [property.id, refreshTrigger]);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300 pb-20 text-slate-800 font-black">
      <div className="flex items-center justify-between mb-8 px-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 返回市場
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          市場即時撮合中
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">{property.name}</h2>
              <button
                onClick={() => setIsInfoOpen(true)}
                title="查看建案詳細資訊與 591 來源"
                className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm border border-blue-100"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-8 mb-8">
               <div className="flex flex-col"><span className="text-sm text-slate-500 font-bold tracking-wider mb-1">即時現價</span><span className="font-mono text-blue-600 text-4xl tracking-tight">${Number(livePrice).toFixed(4)}</span></div>
            </div>
            <div className="aspect-[21/9] bg-slate-900 border border-slate-800 rounded-xl relative flex items-center justify-center p-2 overflow-hidden shadow-inner">
               <KLineChart currentPrice={livePrice} dataLogs={vLogs} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
             <div className="bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm"><div className="text-xs text-slate-500 font-bold mb-2">當日最高</div><div className="text-2xl text-red-500 font-mono">${marketStats.high}</div></div>
             <div className="bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm"><div className="text-xs text-slate-500 font-bold mb-2">當日最低</div><div className="text-2xl text-green-500 font-mono">${marketStats.low}</div></div>
             <div className="bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm"><div className="text-xs text-slate-500 font-bold mb-2">總銷估值</div><div className="text-2xl text-slate-800 font-mono">${((property.price * 100000)/10000).toLocaleString()}萬</div></div>
             <div className="bg-white border border-slate-200 p-6 rounded-xl text-center shadow-sm"><div className="text-xs text-slate-500 font-bold mb-2">市場流通量</div><div className="text-2xl text-blue-600 font-mono">{liveSupply.toLocaleString()}</div></div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          <OrderEntryForm 
            userId={userId} 
            property={property} 
            userProfile={userProfile}
            selectedPrice={selectedOrderPrice} 
            onSuccess={() => setRefreshTrigger(prev => prev + 1)}
          />
          <OrderBook propertyId={property.id} currentPrice={livePrice} onPriceSelect={(p) => setSelectedOrderPrice(p)} />
        </div>
      </div>

      {/* 詳細資訊彈窗 */}
      <PropertyInfoModal 
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        property={{
          ...property,
          price: livePrice
        }}
      />
    </div>
  );
}