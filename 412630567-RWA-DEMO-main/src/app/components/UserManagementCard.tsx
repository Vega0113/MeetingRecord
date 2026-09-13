import { Users, Search, MoreVertical, ShieldAlert, ShieldCheck, UserMinus, UserCheck, Mail, Activity, IdCard, X, Key, Lock, Unlock, Loader2, Filter, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface UserData {
  id: string;
  name: string;
  email: string;
  status: "Whitelisted" | "Blacklisted";
  txStatus: "正常" | "交易異常" | "無法交易";
  kycStatus: "VERIFIED" | "PENDING" | "REJECTED" | "UNSUBMITTED";
  kycRejectionReason?: string;
  joined: string;
}

export function UserManagementCard() {
  const { apiFetch } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [openMenuId, setOpenMenuMenuId] = useState<string | null>(null);
  const [kycUser, setKycUser] = useState<UserData | null>(null);
  const [decryptionKey, setDecryptionKey] = useState("");
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptionError, setDecryptionError] = useState("");
  const [frontImageUrl, setFrontImageUrl] = useState("https://images.unsplash.com/photo-1633265486064-086b219458ce?w=800&q=80");
  const [backImageUrl, setBackImageUrl] = useState("https://images.unsplash.com/photo-1614064641913-6b70fc8cb2c1?w=800&q=80");
  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [customRejectReason, setCustomRejectReason] = useState("身分證反面照片模糊，請重新拍攝補繳");
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);

  // 業務員篩選器 State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED" | "UNSUBMITTED">("ALL");
  const [whitelistFilter, setWhitelistFilter] = useState<"ALL" | "WHITELISTED" | "BLACKLISTED">("ALL");

  const closeKycModal = () => {
    setKycUser(null);
    setIsDecrypted(false);
    setDecryptionKey("");
    setDecryptionError("");
    setIsRejectFormOpen(false);
    setActionFeedback(null);
    setFrontImageUrl("https://images.unsplash.com/photo-1633265486064-086b219458ce?w=800&q=80");
    setBackImageUrl("https://images.unsplash.com/photo-1614064641913-6b70fc8cb2c1?w=800&q=80");
  };

  const loadUsers = async () => {
    try {
      const response = await apiFetch(`/api/users`);
      if (response.ok) {
        const data = await response.json();
        // 資料庫欄位對齊
        const mappedData = data.map((u: any) => ({
          id: u.id.toString(),
          name: u.username,
          email: u.email || 'N/A',
          status: u.is_whitelisted ? "Whitelisted" : "Blacklisted",
          txStatus: u.is_whitelisted ? "正常" : "無法交易",
          kycStatus: u.kyc_status || (u.is_whitelisted ? "VERIFIED" : "PENDING"),
          kycRejectionReason: u.kyc_rejection_reason,
          joined: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : "2026-04-20"
        }));
        setUsers(mappedData);
      }
    } catch (e) {
      console.error("無法加載真實用戶資料，請確保後端伺服器已啟動");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user || isUpdatingStatusId) return;

    const newWhitelisted = user.status === "Blacklisted";
    setIsUpdatingStatusId(id);
    
    try {
      // 呼叫後端 API 進行真實更新，這會觸發 ISO 合規日誌
      const response = await apiFetch(`/api/users/${id}/whitelist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_whitelisted: newWhitelisted,
          reason: "Manual review by Banker Admin" // 符合 ISO 溯源要求
        })
      });

      if (response.ok) {
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === id) {
              return { 
                ...u, 
                status: newWhitelisted ? "Whitelisted" : "Blacklisted",
                txStatus: newWhitelisted ? "正常" : "無法交易"
              };
            }
            return u;
          })
        );
      }
    } catch (e) {
      console.error("資料庫更新失敗");
    } finally {
      setIsUpdatingStatusId(null);
      setOpenMenuMenuId(null);
    }
  };

  const getTxStatusBadge = (status: UserData["txStatus"]) => {
    switch (status) {
      case "正常": 
        return <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-black">正常</span>;
      case "交易異常": 
        return <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-black animate-pulse">交易異常!</span>;
      case "無法交易": 
        return <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-black">無法交易</span>;
    }
  };

  // 各狀態統計計數
  const counts = {
    all: users.length,
    pending: users.filter((u) => u.kycStatus === "PENDING").length,
    verified: users.filter((u) => u.kycStatus === "VERIFIED").length,
    rejected: users.filter((u) => u.kycStatus === "REJECTED").length,
    unsubmitted: users.filter((u) => u.kycStatus === "UNSUBMITTED").length,
  };

  // 複合條件篩選邏輯
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !searchTerm.trim() ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.includes(searchTerm);

    const matchKyc =
      statusFilter === "ALL" || u.kycStatus === statusFilter;

    const matchWhitelist =
      whitelistFilter === "ALL" ||
      (whitelistFilter === "WHITELISTED" && u.status === "Whitelisted") ||
      (whitelistFilter === "BLACKLISTED" && u.status === "Blacklisted");

    return matchSearch && matchKyc && matchWhitelist;
  });

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm flex flex-col transition-all duration-500 ring-1 ring-slate-100 relative">
      {/* 頂部 Header & 搜尋列 */}
      <div className="p-8 border-b border-border bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-t-2xl">
        <div>
          <h3 className="font-black flex items-center gap-3 text-slate-800 text-xl uppercase tracking-tight">
            <Users className="w-8 h-8 text-blue-600" />
            KYC 已認證用戶註冊表
          </h3>
          <p className="text-xs font-bold text-slate-400 mt-1">
            共 {counts.all} 位用戶
            {counts.pending > 0 && (
              <span className="text-amber-600 font-black ml-2 animate-pulse">
                • 尚有 {counts.pending} 位待審核 KYC
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 即時搜尋框 */}
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋用戶姓名、Email 或 ID..." 
              className="pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-black text-slate-700 w-72 shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 白名單篩選 Dropdown */}
          <div className="relative">
            <select
              value={whitelistFilter}
              onChange={(e) => setWhitelistFilter(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-600/10 shadow-sm cursor-pointer"
            >
              <option value="ALL">全部權限</option>
              <option value="WHITELISTED">● 白名單正常</option>
              <option value="BLACKLISTED">○ 黑名單/未授權</option>
            </select>
          </div>
        </div>
      </div>

      {/* 快捷狀態篩選 Tabs */}
      <div className="px-8 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5" /> 篩選狀態：
          </span>

          {/* 全部 */}
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            全部
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusFilter === "ALL" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"}`}>
              {counts.all}
            </span>
          </button>

          {/* 待審核 (PENDING) */}
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              statusFilter === "PENDING"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : counts.pending > 0
                ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            ⏳ 待審核
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              statusFilter === "PENDING" 
                ? "bg-amber-700 text-white" 
                : counts.pending > 0 
                ? "bg-amber-200 text-amber-900 animate-pulse font-black" 
                : "bg-slate-200 text-slate-600"
            }`}>
              {counts.pending}
            </span>
          </button>

          {/* 已通過 (VERIFIED) */}
          <button
            onClick={() => setStatusFilter("VERIFIED")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              statusFilter === "VERIFIED"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            已通過
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === "VERIFIED" ? "bg-green-700 text-white" : "bg-slate-200 text-slate-600"}`}>
              {counts.verified}
            </span>
          </button>

          {/* 已退件 (REJECTED) */}
          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              statusFilter === "REJECTED"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            已退件
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === "REJECTED" ? "bg-red-700 text-white" : "bg-slate-200 text-slate-600"}`}>
              {counts.rejected}
            </span>
          </button>

          {/* 未提交 (UNSUBMITTED) */}
          <button
            onClick={() => setStatusFilter("UNSUBMITTED")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              statusFilter === "UNSUBMITTED"
                ? "bg-slate-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            未提交
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === "UNSUBMITTED" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"}`}>
              {counts.unsubmitted}
            </span>
          </button>
        </div>

        {/* 重設條件按鈕 */}
        {(statusFilter !== "ALL" || whitelistFilter !== "ALL" || searchTerm.trim()) && (
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setWhitelistFilter("ALL");
              setSearchTerm("");
            }}
            className="text-xs font-black text-slate-400 hover:text-blue-600 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重設篩選
          </button>
        )}
      </div>

      <div className="overflow-visible"> {/* 關鍵修正：改為 overflow-visible 避免遮擋選單 */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-border">
            <tr>
              <th className="px-8 py-6 text-xs font-bold text-slate-600 tracking-wider">用戶 ID</th>
              <th className="px-8 py-6 text-xs font-bold text-slate-600 tracking-wider">姓名</th>
              <th className="px-8 py-6 text-xs font-bold text-slate-600 tracking-wider">電子郵件</th>
              <th className="px-8 py-6 text-xs font-bold text-slate-600 tracking-wider text-center">認證狀態</th>
              <th className="px-8 py-6 text-xs font-bold text-slate-600 tracking-wider text-center">交易狀態</th>
              <th className="px-8 py-6 text-xs font-bold text-slate-600 tracking-wider text-right pr-12">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Filter className="w-10 h-10 opacity-30 text-slate-400" />
                    <p className="font-black text-base text-slate-600">沒有符合篩選條件的用戶</p>
                    <p className="text-xs font-bold text-slate-400">請嘗試更換搜尋關鍵字或點擊重設篩選條件</p>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setWhitelistFilter("ALL");
                        setSearchTerm("");
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all mt-2"
                    >
                      清除所有篩選條件
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="px-8 py-8 font-mono text-xs font-black text-slate-400 uppercase">{user.id}</td>
                <td className="px-8 py-8">
                  {/* 關鍵修正：whitespace-nowrap 確保姓名不換行 */}
                  <div className="font-black text-slate-800 text-lg whitespace-nowrap">{user.name}</div>
                </td>
                <td className="px-8 py-8">
                   <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Mail className="w-4 h-4 opacity-30" />
                      {user.email}
                   </div>
                </td>
                <td className="px-8 py-8 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    {/* KYC 審核狀態 Badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                      user.kycStatus === 'VERIFIED'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : user.kycStatus === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        : user.kycStatus === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {user.kycStatus === 'VERIFIED' && '已通過 KYC'}
                      {user.kycStatus === 'PENDING' && '待審核 KYC'}
                      {user.kycStatus === 'REJECTED' && '已退件 (待補件)'}
                      {user.kycStatus === 'UNSUBMITTED' && '未提交 KYC'}
                    </span>

                    {/* 白名單狀態 Badge */}
                    <span className={`text-xs font-bold ${
                      user.status === 'Whitelisted' ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {user.status === 'Whitelisted' ? '● 白名單正常' : '○ 黑名單/未授權'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-8 text-center">
                   {getTxStatusBadge(user.txStatus)}
                </td>
                <td className="px-8 py-8 text-right pr-12 relative">
                  <button 
                    onClick={() => setOpenMenuMenuId(openMenuId === user.id ? null : user.id)}
                    className="p-3 hover:bg-slate-200 rounded-xl transition-all text-slate-400 group-hover:text-slate-800"
                  >
                    <MoreVertical className="w-6 h-6" />
                  </button>

                  {/* 關鍵修正：提高 z-index 並調整位置 */}
                  {openMenuId === user.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuMenuId(null)} />
                      <div className="absolute right-12 top-20 w-60 bg-white border border-border shadow-2xl rounded-[1.5rem] z-50 p-3 animate-in zoom-in-95 duration-200 ring-1 ring-slate-100">
                         <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-4 py-2 border-b border-slate-50 mb-2">Security Control</div>
                         <button 
                           onClick={() => toggleStatus(user.id)}
                           className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                             user.status === 'Whitelisted' 
                               ? 'text-red-600 hover:bg-red-50' 
                               : 'text-green-600 hover:bg-green-50'
                           }`}
                         >
                           {user.status === 'Whitelisted' ? (
                             <><UserMinus className="w-5 h-5" /> 設為黑名單</>
                           ) : (
                             <><UserCheck className="w-5 h-5" /> 移回白名單</>
                           )}
                         </button>
                         <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-slate-400 hover:bg-slate-50 mt-1">
                            <Activity className="w-5 h-5" /> 用戶交易分析
                         </button>
                         <button 
                           onClick={() => {
                             setKycUser(user);
                             setOpenMenuMenuId(null);
                             setIsDecrypted(false);
                             setDecryptionKey("");
                             setDecryptionError("");
                             setFrontImageUrl("https://images.unsplash.com/photo-1633265486064-086b219458ce?w=800&q=80");
                             setBackImageUrl("https://images.unsplash.com/photo-1614064641913-6b70fc8cb2c1?w=800&q=80");
                           }} 
                           className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-blue-600 hover:bg-blue-50 mt-1"
                         >
                            <IdCard className="w-5 h-5" /> 審核 KYC 證件
                         </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      
      <div className="p-6 bg-slate-50/50 border-t border-border rounded-b-[2.5rem] flex items-center justify-between px-8 text-xs font-black text-slate-400">
         <span>
           顯示 {filteredUsers.length} / 共 {counts.all} 位用戶
         </span>
         <button 
           onClick={() => loadUsers()} 
           className="uppercase tracking-[0.2em] hover:text-blue-600 transition-colors flex items-center gap-1.5"
         >
           <RotateCcw className="w-3.5 h-3.5" /> 重新整理數據
         </button>
      </div>

      {/* KYC 證件審核 Modal */}
      {kycUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeKycModal} />
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  {isDecrypted ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">KYC 雙證件審核 (已加密)</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">用戶：{kycUser.name} ({kycUser.email})</p>
                </div>
              </div>
              <button onClick={closeKycModal} className="p-3 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 解密操作區 */}
            <div className="px-8 py-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
               <div className="flex items-center gap-3 w-full max-w-md">
                 <div className="relative flex-1">
                   <Key className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                   <input 
                     type="password" 
                     value={decryptionKey}
                     onChange={(e) => setDecryptionKey(e.target.value)}
                     placeholder="輸入資料庫密鑰解密證件..." 
                     className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-black focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                   />
                 </div>
                  <button 
                    type="button"
                    disabled={isDecrypting || isDecrypted || !decryptionKey.trim()}
                    onClick={async () => {
                      if (isDecrypting || isDecrypted || !decryptionKey.trim()) return;
                      setIsDecrypting(true);
                      setDecryptionError("");
                      try {
                        const response = await apiFetch(`/api/kyc/${kycUser?.id}/decrypt`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminKey: decryptionKey })
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          if (data.frontIdUrl) setFrontImageUrl(data.frontIdUrl);
                          if (data.backIdUrl) setBackImageUrl(data.backIdUrl);
                          setIsDecrypted(true);
                          setDecryptionError("");
                        } else {
                          setIsDecrypted(false);
                          setDecryptionError("資料庫密鑰錯誤，解密失敗！");
                        }
                      } catch (e) {
                        setIsDecrypted(false);
                        setDecryptionError("無法連線至加密伺服器");
                      } finally {
                        setIsDecrypting(false);
                      }
                    }}
                    className={`px-6 py-3 text-white rounded-2xl text-sm font-black shadow-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                      isDecrypting 
                        ? 'bg-slate-700 opacity-80 cursor-wait' 
                        : isDecrypted 
                        ? 'bg-green-500 shadow-green-500/20' 
                        : !decryptionKey.trim()
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-slate-800 hover:bg-slate-700 shadow-slate-800/20 active:scale-95'
                    }`}
                  >
                    {isDecrypting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 解密中...</>
                    ) : isDecrypted ? (
                      <><Unlock className="w-4 h-4"/> 已解密</>
                    ) : (
                      <><Lock className="w-4 h-4"/> 解密影像</>
                    )}
                  </button>
                </div>
               {decryptionError && <div className="text-red-500 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-right-2"><ShieldAlert className="w-5 h-5"/>{decryptionError}</div>}
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30">
              <div className="space-y-4">
                <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDecrypted ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                  身分證正面 (Front)
                </h3>
                <div className="aspect-[1.6/1] bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner relative group p-2 transition-all">
                  {!isDecrypted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200/50 backdrop-blur-3xl z-10 rounded-2xl m-2">
                       <Lock className="w-12 h-12 text-slate-400 mb-3" />
                       <span className="text-slate-500 font-black text-sm uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl">資料已加密</span>
                    </div>
                  )}
                  <img src={frontImageUrl} alt="Front ID" className={`w-full h-full object-cover rounded-2xl transition-all duration-1000 ${!isDecrypted ? 'opacity-30 grayscale blur-xl' : 'opacity-100'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6 rounded-3xl pointer-events-none">
                     <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-white font-bold text-xs">ID_FRONT_ENCRYPTED.enc</span>
                     </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDecrypted ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                  身分證反面 (Back)
                </h3>
                <div className="aspect-[1.6/1] bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner relative group p-2 transition-all">
                  {!isDecrypted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200/50 backdrop-blur-3xl z-10 rounded-2xl m-2">
                       <Lock className="w-12 h-12 text-slate-400 mb-3" />
                       <span className="text-slate-500 font-black text-sm uppercase tracking-widest bg-white/50 px-4 py-2 rounded-xl">資料已加密</span>
                    </div>
                  )}
                  <img src={backImageUrl} alt="Back ID" className={`w-full h-full object-cover rounded-2xl transition-all duration-1000 ${!isDecrypted ? 'opacity-30 grayscale blur-xl' : 'opacity-100'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6 rounded-3xl pointer-events-none">
                     <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-white font-bold text-xs">ID_BACK_ENCRYPTED.enc</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 退件原因輸入抽屜 */}
            {isRejectFormOpen ? (
              <div className="p-8 bg-amber-50/50 border-t border-amber-200 space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-amber-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    請選擇或填寫退件／補件原因 (將即時推播給投資人)
                  </h4>
                  <button
                    onClick={() => setIsRejectFormOpen(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    取消
                  </button>
                </div>

                {/* 快速常用標籤 */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "身分證反面照片模糊，請重新拍攝補繳",
                    "證件有反光遮蔽關鍵文字",
                    "身分證件已過期失效",
                    "身分證正反面照片顛倒",
                    "證件邊角缺失或不完整"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomRejectReason(preset)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                        customRejectReason === preset
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-white border border-amber-200 text-amber-800 hover:bg-amber-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* 自訂原因輸入框 */}
                <input
                  type="text"
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="自訂退件原因..."
                  className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100"
                  >
                    返回
                  </button>
                  <button
                    type="button"
                    disabled={isRejecting || isApproving}
                    onClick={async () => {
                      if (isRejecting || isApproving) return;
                      setIsRejecting(true);
                      try {
                        const res = await apiFetch(`/api/users/${kycUser.id}/kyc/reject`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ reason: customRejectReason })
                        });
                        if (res.ok) {
                          setActionFeedback({ type: 'success', message: `已成功退件！已將用戶 ${kycUser.name} 標記為 REJECTED 並推播通知。` });
                          setIsRejectFormOpen(false);
                          loadUsers();
                          setTimeout(() => {
                            closeKycModal();
                            setActionFeedback(null);
                          }, 1500);
                        } else {
                          setActionFeedback({ type: 'error', message: '退件操作失敗' });
                        }
                      } catch (e) {
                        setActionFeedback({ type: 'error', message: '連線伺服器失敗' });
                      } finally {
                        setIsRejecting(false);
                      }
                    }}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    {isRejecting ? "正在提交退件..." : "確認駁回退件"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-8 py-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4 relative z-20">
                <button 
                  disabled={isApproving || isRejecting}
                  onClick={closeKycModal} 
                  className="px-6 py-3 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  取消
                </button>
                
                <div className="flex items-center gap-3">
                  {/* 駁回 / 退件需補件按鈕 */}
                  <button
                    disabled={!isDecrypted || isApproving || isRejecting}
                    onClick={() => {
                      if (!isDecrypted) {
                        setDecryptionError("請先解密影像再進行審核！");
                        return;
                      }
                      setIsRejectFormOpen(true);
                    }}
                    className={`px-6 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all flex items-center gap-2 ${
                      !isDecrypted || isApproving || isRejecting 
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 active:scale-95'
                    }`}
                  >
                    <X className="w-4 h-4" /> 駁回 (要求補件)
                  </button>

                  {/* 核准認證按鈕 */}
                  <button 
                    disabled={!isDecrypted || isApproving || isRejecting}
                    onClick={async () => {
                      if (!isDecrypted) {
                        setDecryptionError("請先解密影像再進行審核！");
                        return;
                      }
                      if (isApproving || isRejecting) return;
                      setIsApproving(true);
                      try {
                        const res = await apiFetch(`/api/users/${kycUser.id}/kyc`, { method: 'PATCH' });
                        if (res.ok) {
                          setActionFeedback({ type: 'success', message: `已成功核准用戶 ${kycUser.name}！已部署鏈上身分並開通白名單。` });
                          loadUsers();
                          setTimeout(() => {
                            closeKycModal();
                            setActionFeedback(null);
                          }, 1500);
                        } else {
                          toggleStatus(kycUser.id);
                          closeKycModal();
                        }
                      } catch (e) {
                        toggleStatus(kycUser.id);
                        closeKycModal();
                      } finally {
                        setIsApproving(false);
                      }
                    }}
                    className={`px-8 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all flex items-center gap-2 ${
                      !isDecrypted || isApproving || isRejecting 
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : kycUser.status === 'Whitelisted' 
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 active:scale-95' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-95'
                    }`}
                  >
                    {isApproving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 正在處理鏈上 KYC...</>
                    ) : !isDecrypted ? (
                      <><Lock className="w-4 h-4" /> 鎖定中</>
                    ) : kycUser.status === 'Whitelisted' ? (
                      <><ShieldAlert className="w-4 h-4" /> 撤銷認證 (設為黑名單)</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /> 核准認證 (移入白名單)</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {actionFeedback && (
              <div className={`p-4 text-center text-xs font-black border-t ${
                actionFeedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {actionFeedback.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
