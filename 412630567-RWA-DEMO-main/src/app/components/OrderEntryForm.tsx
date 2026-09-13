import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, Lock, AlertTriangle, Wallet, Coins } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSystemControl } from "../context/SystemControlContext";
import { useHeartbeat } from "../context/SystemHeartbeatContext";
import { TransactionSuccessModal } from "./TransactionSuccessModal";

interface OrderEntryFormProps {
  userId: number;
  property: any;
  userProfile?: any;
  selectedPrice?: number | null;
  onSuccess?: () => void;
}

export function OrderEntryForm({ userId, property, userProfile, selectedPrice, onSuccess }: OrderEntryFormProps) {
  const { apiFetch, isWhitelisted, kycStatus, userName, refreshProfile } = useAuth();
  const { isPaused } = useSystemControl(); // 取得系統暫停狀態
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [tokenAmount, setTokenAmount] = useState("");
  const [limitTokenPrice, setLimitTokenPrice] = useState("");
  const [txType, setTxType] = useState<"BUY" | "SELL">("BUY");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [localProfile, setLocalProfile] = useState<any>(userProfile || null);

  useEffect(() => {
    if (userProfile) {
      setLocalProfile(userProfile);
    }
  }, [userProfile]);

  useEffect(() => {
    refreshProfile?.();
    apiFetch('/api/users/profile/me')
      .then(res => res.json())
      .then(data => {
        if (data && (data.is_whitelisted !== undefined || data.kyc_status)) {
          setLocalProfile(data);
        }
      })
      .catch(() => {});
  }, [apiFetch, refreshProfile]);

  const isDemoVerified = userName === 'investor' || userName === 'technician' || userName === 'banker' || userName === 'test3' || userName === 'reyliou' || userName === 'test1' || userName === 'test2' || userId === 3 || userId === 4;
  const effectiveWhitelisted = localProfile?.is_whitelisted !== undefined 
    ? !!localProfile.is_whitelisted 
    : (isWhitelisted || isDemoVerified);

  const effectiveKycStatus = localProfile?.kyc_status 
    || (isDemoVerified ? 'VERIFIED' : kycStatus);

  const canTrade = effectiveWhitelisted || effectiveKycStatus === 'VERIFIED';

  // 當使用者在 OrderBook 點擊價格時，自動切換至限價單並填入價格
  useEffect(() => {
    if (selectedPrice !== undefined && selectedPrice !== null) {
      setOrderType("limit");
      setLimitTokenPrice(selectedPrice.toFixed(2));
    }
  }, [selectedPrice]);

  const [tradeError, setTradeError] = useState<string | null>(null);
  const [holdingBalance, setHoldingBalance] = useState<number>(0);
  const { tick } = useHeartbeat();

  const fetchHolding = useCallback(async () => {
    if (!userId || !property?.id) return;
    try {
      const res = await apiFetch(`/api/portfolio/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const match = data?.holdings?.find((h: any) => Number(h.property_id || h.id) === Number(property.id));
        setHoldingBalance(match ? parseFloat(String(match.balance || '0')) : 0);
      }
    } catch (err) {
      console.error("Failed to fetch holdings", err);
    }
  }, [userId, property?.id, apiFetch]);

  useEffect(() => {
    fetchHolding();
  }, [fetchHolding]);

  useEffect(() => {
    if (tick % 10 === 0) {
      fetchHolding();
    }
  }, [tick, fetchHolding]);

  const cashBalance = parseFloat(String(localProfile?.cash_balance ?? localProfile?.total_asset_value ?? "0"));
  const totalTwdValue = parseFloat(tokenAmount || "0") * (orderType === "market" ? property.price : parseFloat(limitTokenPrice || "0"));

  const confirmOrder = async () => {
    setTradeError(null);
    if (!canTrade) {
      setTradeError("您的帳號尚未通過 KYC 白名單審核，無法進行下單交易。");
      return;
    }

    if (isPaused) {
       setTradeError("系統目前處於暫停狀態，無法進行交易。");
       return;
    }

    const amount = parseFloat(tokenAmount);
    const price = orderType === 'market' ? property.price : parseFloat(limitTokenPrice);
    if (isNaN(amount) || amount <= 0) { 
      setTradeError("請輸入有效的代幣數量"); 
      return; 
    }
    if (orderType === 'limit' && (isNaN(price) || price <= 0)) { 
      setTradeError("請輸入有效的目標限價"); 
      return; 
    }

    if (txType === 'BUY' && totalTwdValue > cashBalance) {
      setTradeError(`現金餘額不足！目前可用餘額為 $${cashBalance.toLocaleString()} TWD，本次買入需支付 $${totalTwdValue.toLocaleString()} TWD。`);
      return;
    }

    if (txType === 'SELL' && amount > holdingBalance) {
      setTradeError(`持倉代幣不足！您目前持有 ${holdingBalance.toLocaleString()} 枚，無法委託賣出 ${amount.toLocaleString()} 枚。`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          property_id: property.id, 
          tx_type: txType, 
          order_type: orderType.toUpperCase(), 
          token_amount: amount, 
          price_per_token: price,
          idempotency_key: idempotencyKey
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setIsConfirmOpen(false);
        setIsSuccessOpen(true);
        refreshProfile?.();
        fetchHolding();
        onSuccess?.();
      } else {
        setTradeError(data.message || "交易下單失敗，請檢查錢包或庫存");
      }
    } catch (e) { 
      setTradeError("連線後端 API 失敗，請確認伺服器在線"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`bg-white border rounded-2xl p-8 shadow-sm flex flex-col ${isPaused ? 'border-red-300' : !canTrade ? 'border-amber-200 bg-slate-50/30' : 'border-slate-200'} relative overflow-hidden`}>
        {isPaused && (
           <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center text-xs font-bold py-1.5 animate-pulse">
              系統維護中 ｜ 交易功能暫停
           </div>
        )}
        
        <div className="flex items-center justify-between border-b pb-4 mt-2 mb-6">
          <h3 className="font-black text-2xl text-slate-800">代幣交易委託</h3>
          {!canTrade && (
            <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 border border-amber-200">
              <Lock className="w-3 h-3" /> KYC 未開通
            </span>
          )}
        </div>

        {/* 權限不足提示鎖定條 */}
        {!canTrade && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 mb-6 animate-in fade-in text-amber-900">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-black text-xs">帳號尚未開通交易權限</div>
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                {effectiveKycStatus === 'PENDING' 
                  ? '您的實名證件正在由銀行審核中，審核通過前無法進行下單交易。' 
                  : effectiveKycStatus === 'REJECTED' 
                  ? '您的 KYC 審核未通過，請至帳戶首頁補繳證件。' 
                  : '您尚未提交 KYC 雙證件，請先至首頁完成實名認證。'}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
          <button disabled={!canTrade || isPaused || isSubmitting} onClick={() => setOrderType("market")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${orderType === 'market' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'} disabled:opacity-40 disabled:cursor-not-allowed`}>市價委託</button>
          <button disabled={!canTrade || isPaused || isSubmitting} onClick={() => setOrderType("limit")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${orderType === 'limit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'} disabled:opacity-40 disabled:cursor-not-allowed`}>限價排隊</button>
        </div>

        <div className="space-y-6 mb-10">
          {orderType === "limit" && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-500 ml-2">目標限價 (TWD)</label>
              <div className="relative">
                <span className="absolute left-5 top-4 text-xl text-slate-400 font-black">$</span>
                <input 
                  type="number" 
                  value={limitTokenPrice} 
                  onChange={(e) => setLimitTokenPrice(e.target.value)} 
                  placeholder={property.price.toString()}
                  disabled={!canTrade || isPaused || isSubmitting}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-2xl outline-none font-mono font-black text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 ml-2">
              <label className="text-xs font-bold text-slate-500">委託數量 (枚)</label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                  <Wallet className="w-3.5 h-3.5 text-blue-600" />
                  <span>可用現金：</span>
                  <span className="font-mono text-blue-600 font-bold">${cashBalance.toLocaleString()} TWD</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTokenAmount(holdingBalance.toString())}
                  title="點擊帶入全部持倉數量"
                  className="text-xs font-bold text-slate-600 hover:text-amber-700 flex items-center gap-1.5 bg-slate-50 hover:bg-amber-50 px-3 py-1 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>目前持有：</span>
                  <span className="font-mono text-amber-600 font-bold">{holdingBalance.toLocaleString()} 枚</span>
                </button>
              </div>
            </div>
            <input 
              type="number" 
              value={tokenAmount} 
              onChange={(e) => setTokenAmount(e.target.value)} 
              placeholder="0"
              disabled={!canTrade || isPaused || isSubmitting}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-3xl outline-none font-mono font-black text-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
            />
          </div>
          
          <div className="flex justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
             <span className="text-xs font-bold text-slate-500">預估交易總額</span>
             <span className="font-mono font-black text-slate-800">${totalTwdValue.toLocaleString()} TWD</span>
          </div>

          {totalTwdValue > 0 && totalTwdValue > cashBalance && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>現金餘額不足！尚缺 ${(totalTwdValue - cashBalance).toLocaleString()} TWD</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            disabled={!canTrade || isPaused || isSubmitting} 
            onClick={() => { setTxType("BUY"); setIdempotencyKey(crypto.randomUUID()); setIsConfirmOpen(true); }} 
            className={`py-4 text-white rounded-xl uppercase font-black shadow-sm transition-all active:scale-95 text-base flex items-center justify-center gap-2 ${
              !canTrade 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-50' 
                : 'bg-red-600 hover:bg-red-700'
            } disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none`}
          >
            {isSubmitting && txType === "BUY" ? "處理中..." : !canTrade ? <><Lock className="w-4 h-4"/> 申購 (鎖定)</> : "申購 (買入)"}
          </button>
          <button 
            disabled={!canTrade || isPaused || isSubmitting} 
            onClick={() => { setTxType("SELL"); setIdempotencyKey(crypto.randomUUID()); setIsConfirmOpen(true); }} 
            className={`py-4 text-white rounded-xl uppercase font-black shadow-sm transition-all active:scale-95 text-base flex items-center justify-center gap-2 ${
              !canTrade 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-50' 
                : 'bg-green-600 hover:bg-green-700'
            } disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none`}
          >
            {isSubmitting && txType === "SELL" ? "處理中..." : !canTrade ? <><Lock className="w-4 h-4"/> 委賣 (鎖定)</> : "委賣 (賣出)"}
          </button>
        </div>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-sm ${txType === 'BUY' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    <ShieldAlert className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">委託確認</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">{orderType === 'market' ? '市價即時撮合' : '進入掛單簿等待撮合'}</p>
              </div>
              <div className="space-y-4 bg-slate-50 p-5 rounded-xl mb-6 border border-slate-200">
                 <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                    <span>類型</span>
                    <span className={`px-2.5 py-0.5 rounded-md font-bold ${txType === 'BUY' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{txType === 'BUY' ? '買入' : '賣出'} {orderType === 'market' ? '(市價)' : '(限價)'}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                    <span>數量</span>
                    <span className="font-mono text-base text-slate-800 font-bold">{parseFloat(tokenAmount || '0').toLocaleString()} 枚</span>
                 </div>
                 {txType === 'SELL' && (
                   <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                      <span>目前持有</span>
                      <span className="font-mono text-base text-slate-700">{holdingBalance.toLocaleString()} 枚</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500 border-t border-slate-200 pt-3">
                    <span>總計金額</span>
                    <span className="font-mono text-lg font-bold text-blue-600">${totalTwdValue.toLocaleString()} TWD</span>
                 </div>
              </div>

              {txType === 'SELL' && parseFloat(tokenAmount || '0') > holdingBalance && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2 animate-in fade-in">
                   <AlertTriangle className="w-4 h-4 shrink-0" />
                   <span>持倉數量不足！您目前僅持有 {holdingBalance.toLocaleString()} 枚，無法委託賣出。</span>
                 </div>
              )}

              {tradeError && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 animate-in fade-in">
                   {tradeError}
                 </div>
               )}

              <div className="flex gap-3">
                 <button onClick={() => { setIsConfirmOpen(false); setTradeError(null); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl font-bold uppercase transition-colors">取消</button>
                 <button onClick={confirmOrder} disabled={isSubmitting || (txType === 'SELL' && parseFloat(tokenAmount || '0') > holdingBalance) || (txType === 'BUY' && totalTwdValue > cashBalance)} className={`flex-[2] py-3.5 rounded-xl text-white font-bold uppercase shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${txType === 'BUY' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isSubmitting ? "正在下單..." : "確認下單"}
                 </button>
              </div>
           </div>
        </div>
      )}

      <TransactionSuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => setIsSuccessOpen(false)} 
        type={txType} 
        orderType={orderType} 
        tokenAmount={tokenAmount} 
        price={orderType === 'market' ? property.price : parseFloat(limitTokenPrice || '0')} 
        propertyName={property.name} 
      />
    </>
  );
}
