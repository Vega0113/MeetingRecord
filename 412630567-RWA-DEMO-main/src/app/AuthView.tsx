import { Shield, LogIn, UserPlus, Upload, CheckCircle, ArrowRight, User, Fingerprint, FileText, Mail, Phone, Loader2, Lock, Eye, EyeOff, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { AppMode } from "./App";

import { API_BASE_URL } from "./config";

interface AuthViewProps {
  onLogin: (mode: AppMode, name: string, id: number, token: string, isWhitelisted?: boolean, kycStatus?: string) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [view, setView] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [kycStep, setKycStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 登入狀態
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authNotice, setAuthNotice] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [kycFileFront, setKycFileFront] = useState<File | null>(null);
  const [kycFileBack, setKycFileBack] = useState<File | null>(null);

  const handleStep1Next = () => {
    setAuthNotice(null);
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setAuthNotice({ text: "請先完整填寫第一步的所有註冊欄位！", type: "error" });
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setAuthNotice({ text: "兩次輸入的密碼不一致，請重新確認！", type: "error" });
      return;
    }
    
    if (!/^09\d{8}$/.test(regPhone)) {
      setAuthNotice({ text: "手機號碼格式錯誤，請輸入 09 開頭的 10 碼數字", type: "error" });
      return;
    }

    setKycStep(2);
  };

  const handleQuickRegister = async () => {
    setAuthNotice(null);
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setAuthNotice({ text: "請先完整填寫第一步的所有註冊欄位！", type: "error" });
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setAuthNotice({ text: "兩次輸入的密碼不一致，請重新確認！", type: "error" });
      return;
    }
    
    if (!/^09\d{8}$/.test(regPhone)) {
      setAuthNotice({ text: "手機號碼格式錯誤，請輸入 09 開頭的 10 碼數字", type: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("username", regName);
      formData.append("email", regEmail);
      formData.append("phone_number", regPhone);
      formData.append("password", regPassword);

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUsername(regName);
        setPassword(regPassword);
        setView("LOGIN");
        setKycStep(1);
        setAuthNotice({ text: "註冊成功！您現在可以立即登入，並隨時於首頁補繳實名雙證件。", type: "success" });
      } else {
        setAuthNotice({ text: "註冊失敗: " + (data.message || "發生未知錯誤"), type: "error" });
      }
    } catch (e) {
      setAuthNotice({ text: "連線後端 API 失敗，請確認後端伺服器已啟動", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const validateAuthFile = (file: File, label: string) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!allowed.includes(ext)) {
      return `${label}副檔名不合法 (${ext || '未知'})，僅接受 JPG 或 PNG 圖檔！`;
    }
    if (file.size > 5 * 1024 * 1024) {
      return `${label}檔案大小 (${(file.size / 1024 / 1024).toFixed(1)}MB) 超過 5MB 上限！`;
    }
    return null;
  };

  const handleKycUpload = async () => {
    setAuthNotice(null);
    if (!kycFileFront || !kycFileBack) {
      setAuthNotice({ text: "請完整上傳身分證正反面照片！", type: "error" });
      return;
    }

    const frontErr = validateAuthFile(kycFileFront, "身分證正面");
    if (frontErr) { setAuthNotice({ text: frontErr, type: "error" }); return; }
    const backErr = validateAuthFile(kycFileBack, "身分證反面");
    if (backErr) { setAuthNotice({ text: backErr, type: "error" }); return; }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("username", regName);
      formData.append("email", regEmail);
      formData.append("phone_number", regPhone);
      formData.append("password", regPassword);
      formData.append("kyc_document", kycFileFront);
      formData.append("kyc_document_back", kycFileBack);

      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setKycStep(3);
      } else {
        setAuthNotice({ text: "註冊失敗: " + (data.message || "發生未知錯誤"), type: "error" });
      }
    } catch (e) {
      setAuthNotice({ text: "連線後端 API 失敗，請確認後端伺服器已啟動", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthNotice(null);
    if (!username || !password) {
      setAuthNotice({ text: "請輸入帳號與密碼", type: "error" });
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (data.success) {
        const rawRole = data.user.role;
        let targetMode: AppMode = "INVESTOR";
        const normalizedRole = rawRole.toUpperCase().trim();

        if (normalizedRole === "TECHNICAL" || normalizedRole === "IT_ADMIN") {
          targetMode = "TECHNICAL";
        } else if (normalizedRole === "BUSINESS" || normalizedRole === "BANK_STAFF") {
          targetMode = "BUSINESS";
        } else {
          targetMode = "INVESTOR";
        }

        onLogin(targetMode, data.user.username, data.user.id, data.token, data.user.is_whitelisted, data.user.kyc_status);
      } else {
        setAuthNotice({ text: "登入失敗: " + (data.message || "請檢查帳號密碼"), type: "error" });
      }
    } catch (e) {
      setAuthNotice({ text: "連線後端 API 失敗，請確認伺服器已啟動", type: "error" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Header */}
        <div className="p-10 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md mb-6 mx-auto">
            <Shield className="w-11 h-11 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase">RWA BANK</h1>
          <p className="text-slate-500 text-xs font-bold mt-2 text-center">真實世界資產代幣化平台</p>
        </div>

        {authNotice && (
          <div className={`mx-8 mt-6 p-4 rounded-2xl text-xs font-black flex items-center justify-between border animate-in slide-in-from-top-2 ${
            authNotice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span>{authNotice.text}</span>
            <button type="button" onClick={() => setAuthNotice(null)} className="opacity-60 hover:opacity-100 font-bold ml-2">✕</button>
          </div>
        )}

        {view === "LOGIN" ? (
          <form onSubmit={handleManualLogin} className="px-12 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
               <h2 className="text-2xl font-black text-slate-800 tracking-tighter">帳戶登入</h2>
               <p className="text-xs text-slate-400 font-medium mt-1">請輸入您的帳號密碼進行身份驗證</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <User className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="帳號 (technician, banker...)" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-black text-lg text-slate-800" 
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="密碼" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-black text-lg text-slate-800" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-5 text-slate-300 hover:text-slate-600 transition-colors">{showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}</button>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-5 bg-slate-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-900 active:scale-95 transition-all shadow-md disabled:opacity-50 uppercase tracking-wider"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {isLoggingIn ? "正在連線資料庫..." : "登入系統"}
              </button>
            </div>
            
            <div className="text-center pt-5 border-t border-slate-100">
               <div className="text-xs text-slate-500 font-bold mb-3 tracking-wide">快速示範帳號切換 (DEMO)</div>
               <div className="grid grid-cols-3 gap-2.5">
                  <button type="button" onClick={() => setUsername("technician")} className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 p-3 rounded-xl text-xs font-bold text-slate-700 transition-all border border-slate-200 shadow-sm hover:border-indigo-300">technician (技術)</button>
                  <button type="button" onClick={() => setUsername("banker")} className="bg-slate-50 hover:bg-purple-50 hover:text-purple-700 p-3 rounded-xl text-xs font-bold text-slate-700 transition-all border border-slate-200 shadow-sm hover:border-purple-300">banker (業務)</button>
                  <button type="button" onClick={() => setUsername("investor")} className="bg-slate-50 hover:bg-blue-50 hover:text-blue-700 p-3 rounded-xl text-xs font-bold text-slate-700 transition-all border border-slate-200 shadow-sm hover:border-blue-300">investor (投資)</button>
               </div>
            </div>
            
            <div className="text-center">
              <span className="text-sm text-slate-400 font-bold">尚未擁有帳戶？</span>
              <button type="button" onClick={() => setView("REGISTER")} className="text-sm font-black text-blue-600 hover:underline ml-2 uppercase tracking-tighter italic">立即註冊 KYC</button>
            </div>
          </form>
        ) : (
          /* 恢復後的完整 3 步驟註冊流程 */
          <div className="px-12 py-12 space-y-8 animate-in fade-in slide-in-from-right-6 duration-500 text-slate-800">
            <div className="flex items-center justify-between px-8 mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors ${kycStep >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-300'}`}>
                    {kycStep > s ? <CheckCircle className="w-6 h-6" /> : s}
                  </div>
                  {s < 3 && <div className={`w-16 h-1 ${kycStep > s ? 'bg-blue-600' : 'bg-slate-100'}`} />}
                </div>
              ))}
            </div>

            {kycStep === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center"><h3 className="text-3xl font-black text-slate-800 tracking-tight">建立個人帳戶</h3><p className="text-xs text-slate-400 mt-2 font-bold">步驟一：基本帳戶資料</p></div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <User className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                    <input type="text" placeholder="真實姓名 (作為登入帳號)" value={regName} onChange={e => setRegName(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600/20 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Mail className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                      <input type="email" placeholder="電子郵件" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600/20 font-bold" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                      <input type="tel" placeholder="手機號碼 (09...)" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600/20 font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Lock className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                      <input type="password" placeholder="設定密碼" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600/20 font-bold" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-5 top-5 w-5 h-5 text-slate-300" />
                      <input type="password" placeholder="確認密碼" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-2 focus:ring-blue-600/20 font-bold" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <button 
                    onClick={handleStep1Next} 
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-200 uppercase transition-all"
                  >
                    下一步: 立即上傳證件 (推薦)
                  </button>
                  <button 
                    onClick={handleQuickRegister} 
                    disabled={isUploading}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-3xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    直接完成註冊 (稍後於後台補件)
                  </button>
                </div>
              </div>
            )}

            {kycStep === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center"><h3 className="text-3xl font-black text-slate-800">證件影像上傳</h3><p className="text-xs text-slate-400 mt-2 font-bold">步驟二：實名雙證件核驗</p></div>
                <div className="grid grid-cols-2 gap-6">
                  <label className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 group hover:bg-blue-50 cursor-pointer transition-all overflow-hidden">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                      onChange={(e) => { 
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const err = validateAuthFile(file, "身分證正面");
                          if (err) { setAuthNotice({ text: err, type: "error" }); return; }
                          setKycFileFront(file);
                          setAuthNotice(null);
                        } 
                      }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    {kycFileFront ? (
                      <div className="text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" /><span className="text-xs font-bold text-slate-700">{kycFileFront.name}</span></div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4"><FileText className="w-7 h-7 text-blue-500" /></div>
                        <span className="text-sm font-bold text-slate-800">身分證正面</span><span className="text-xs font-bold text-blue-500 mt-1">JPG / PNG (最大 5MB)</span>
                      </>
                    )}
                  </label>
                  <label className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 group hover:bg-blue-50 cursor-pointer transition-all overflow-hidden">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                      onChange={(e) => { 
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const err = validateAuthFile(file, "身分證反面");
                          if (err) { setAuthNotice({ text: err, type: "error" }); return; }
                          setKycFileBack(file);
                          setAuthNotice(null);
                        } 
                      }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    {kycFileBack ? (
                      <div className="text-center"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" /><span className="text-xs font-bold text-slate-700">{kycFileBack.name}</span></div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4"><FileText className="w-7 h-7 text-blue-500" /></div>
                        <span className="text-sm font-bold text-slate-800">身分證背面</span><span className="text-xs font-bold text-blue-500 mt-1">JPG / PNG (最大 5MB)</span>
                      </>
                    )}
                  </label>
                </div>
                <div className="space-y-3">
                  <button onClick={handleKycUpload} disabled={isUploading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {isUploading ? "正在加密上傳..." : "確認並提交審核"}
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setKycStep(1)} 
                      className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all"
                    >
                      返回上一步
                    </button>
                    <button 
                      onClick={handleQuickRegister} 
                      disabled={isUploading}
                      className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all"
                    >
                      跳過並稍後補件
                    </button>
                  </div>
                </div>
              </div>
            )}

            {kycStep === 3 && (
              <div className="space-y-6 animate-in zoom-in duration-300 text-center py-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">註冊申請已受理</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">您的 KYC 資料已成功加密寫入審核佇列。<br/>銀行人員核實身分後將開通您的鏈上交易權限。</p>
                <button onClick={() => { setView("LOGIN"); setKycStep(1); }} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-lg mt-4 shadow-sm transition-all">前往登入</button>
              </div>
            )}

            {kycStep < 3 && (
              <button onClick={() => setView("LOGIN")} className="w-full text-lg font-black text-slate-400 hover:text-red-500 transition-colors py-2 uppercase tracking-tighter text-center">取消並返回</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
