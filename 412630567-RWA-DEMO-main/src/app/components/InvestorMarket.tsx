import { Search, MapPin, TrendingUp, Filter, LayoutGrid, List, Check, TrendingDown, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { PropertyInfoModal } from "./PropertyInfoModal";

interface Property {
  id: number;
  name: string;
  addr: string;
  price: number;
  change: string;
  img: string;
  city_tag: string;
  price_display?: string;
  total_value?: number;
  total_supply?: number;
  total_supply_x?: number;
  payout_cycle_days?: number;
  size_ping?: number;
  yesterday_close_price?: number;
  token_address?: string;
  token_symbol?: string;
  fundraising_goal?: number;
  complete_address?: string;
}

interface InvestorMarketProps {
  onSelectProperty: (property: Property) => void;
}

export function InvestorMarket({ onSelectProperty }: InvestorMarketProps) {
  const { apiFetch } = useAuth();
  const [selectedCity, setSelectedCity] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedInfoProperty, setSelectedInfoProperty] = useState<Property | null>(null);

  const regions = [
    { label: "北部", cities: ["全部", "台北市", "新北市", "桃園市", "新竹市", "新竹縣", "宜蘭縣", "基隆市"] },
    { label: "中部", cities: ["台中市", "彰化縣", "雲林縣", "苗栗縣", "南投縣"] },
    { label: "南部", cities: ["高雄市", "台南市", "嘉義市", "嘉義縣", "屏東縣"] },
    { label: "東部", cities: ["台東縣", "花蓮縣", "澎湖縣", "金門縣", "連江縣"] },
  ];

  useEffect(() => {
    const loadMockData = async () => {
      try {
        // 從後端 API 獲取真實資料庫數據
        const response = await apiFetch(`/api/properties`);
        if (response.ok) {
          const data = await response.json();
          // 資料庫欄位對齊：將 title 映射到 name，依昨收價動態計算漲跌幅
          const mappedData = data.map((p: any) => {
            const curPrice = parseFloat(p.current_price || "0");
            const yestPrice = parseFloat(p.yesterday_close_price || "0");
            let changePercentStr = "+0.00";
            if (yestPrice > 0) {
              const diff = ((curPrice - yestPrice) / yestPrice) * 100;
              changePercentStr = (diff >= 0 ? "+" : "") + diff.toFixed(2);
            }
            return {
              id: p.id,
              name: p.title,
              addr: p.complete_address,
              complete_address: p.complete_address,
              price: curPrice,
              change: changePercentStr,
              img: p.main_image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
              city_tag: p.location,
              total_supply: parseFloat(p.total_supply_x || "100000"),
              total_value: curPrice * parseFloat(p.total_supply_x || "100000"),
              payout_cycle_days: parseInt(p.payout_cycle_days || "30"),
              size_ping: parseFloat(p.size_ping || "35.0"),
              yesterday_close_price: yestPrice,
              token_address: p.token_address || "0x95401dc811bb5740090279ba06cfa8fcf6113778",
              fundraising_goal: parseFloat(p.fundraising_goal || "18900000"),
              token_symbol: p.token_symbol || "RWA"
            };
          });
          setProperties(mappedData);
        }
      } catch (e) {
        console.error("連線 API 失敗，請確保後端伺服器已啟動");
      }
    };
    loadMockData();
  }, []);

  const filteredProperties = properties.filter((p) => {
    const matchesCity = selectedCity === "全部" || p.city_tag === selectedCity;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.city_tag.includes(searchQuery);
    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white border border-border p-8 rounded-2xl shadow-sm space-y-8 ring-1 ring-slate-100">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-5.5 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋房產案名、關鍵字或縣市..." 
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-blue-600/10 outline-none text-xl font-bold text-slate-800 transition-all"
            />
          </div>
          <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg shadow-sm transition-all active:scale-95 flex items-center gap-3">
            <Search className="w-5 h-5" /> 立即搜尋
          </button>
        </div>

        <div className="space-y-6 pt-2">
          {regions.map((region) => (
            <div key={region.label} className="flex items-start gap-6 border-b border-slate-50 pb-4 last:border-0">
               <div className="w-16 pt-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{region.label}</span>
               </div>
               <div className="flex-1 flex flex-wrap gap-2">
                  {region.cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-5 py-2 rounded-xl text-sm font-black transition-all border ${
                        selectedCity === city 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105' 
                          : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-600'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 flex items-center justify-between">
         <div className="text-sm font-bold text-slate-500">
            找到 <span className="text-blue-600 font-black text-lg">{filteredProperties.length}</span> 個符合條件的標的
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProperties.map((prop) => {
          const isUp = prop.change.startsWith('+');
          return (
            <div 
              key={prop.id} 
              onClick={() => onSelectProperty(prop)}
              className="group bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 overflow-hidden">
                  <img src={prop.img} alt={prop.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex gap-2">
                     <div className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-xl text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                      {prop.city_tag}
                     </div>
                     <div className="px-3 py-1 bg-blue-600 text-white shadow-sm rounded-xl text-[10px] font-bold">
                      現貨
                     </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfoProperty(prop);
                    }}
                    title="查看建案詳細資訊"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 shadow-md backdrop-blur flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-7 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3 min-h-[3.5rem]">
                    <h4 className="font-black text-2xl text-slate-800 group-hover:text-blue-600 transition-colors leading-tight flex-1">
                      {prop.name}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInfoProperty(prop);
                      }}
                      title="查看建案詳細資訊"
                      className="mt-1 p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 font-bold truncate mb-3">{prop.addr}</div>
                </div>
              </div>
              <div className="p-7 pt-0">
                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold mb-1">即時現價</span>
                    <span className="font-mono font-black text-blue-600 text-2xl">${prop.price}</span>
                  </div>
                  {/* 台灣股市：漲紅跌綠 */}
                  <div className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${isUp ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {prop.change}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 詳細資訊彈窗 */}
      <PropertyInfoModal 
        isOpen={!!selectedInfoProperty}
        onClose={() => setSelectedInfoProperty(null)}
        property={selectedInfoProperty}
      />
    </div>
  );
}
