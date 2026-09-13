import { X, Lock, Key, CheckCircle2, ShieldCheck, Bell, ChevronRight, BellRing, Settings, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export function SettingsModal({ isOpen, onClose, userName }: SettingsModalProps) {
  const { apiFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, [isOpen]);

  // 重置表單狀態
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      setIsUpdating(false);
    }
  }, [isOpen]);

  const requestNotification = async () => {
    if (!("Notification" in window)) {
      alert("您的瀏覽器不支援桌面通知");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      new Notification("通知已開啟", {
        body: "您將會在此收到系統的即時通知！",
        icon: "/favicon.ico"
      });
    }
  };

  const handleUpdate = async () => {
    setErrorMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg("請完整填寫所有密碼欄位！");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("新密碼長度至少需 6 個字元！");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("兩次輸入的新密碼不一致，請重新確認！");
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMsg("新密碼不能與當前舊密碼相同！");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "修改密碼失敗");
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(3);
    } catch (e: any) {
      setErrorMsg(e.message || "連線伺服器失敗，請稍後再試");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                {step === 1 ? <Settings className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
             </div>
             <div>
                <h3 className="font-black text-sm text-slate-800">
                  {step === 1 ? "系統設定" : step === 2 ? "修改密碼" : "設定完成"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">User: {userName}</p>
             </div>
          </div>
          <button onClick={() => { setStep(1); onClose(); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-4">
            {/* 網頁通知設定 */}
            <button 
              onClick={requestNotification}
              disabled={notifPermission === "granted"}
              className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                notifPermission === "granted" 
                  ? "bg-green-50 border border-green-100 cursor-default" 
                  : "bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer active:scale-[0.98]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifPermission === "granted" ? "bg-green-100 text-green-600" : "bg-white text-slate-600 shadow-sm"}`}>
                  {notifPermission === "granted" ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <h4 className={`font-black text-sm ${notifPermission === "granted" ? "text-green-800" : "text-slate-700"}`}>桌面推播通知</h4>
                  <p className="text-[11px] text-slate-500 font-medium">接收訂單成交與系統警報</p>
                </div>
              </div>
              {notifPermission === "granted" ? (
                <span className="text-[10px] font-black bg-green-200 text-green-700 px-2 py-1 rounded-lg">已開啟</span>
              ) : (
                <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">點擊開啟</span>
              )}
            </button>

            {/* 修改密碼入口 */}
            <button 
              onClick={() => { setErrorMsg(""); setStep(2); }}
              className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white text-slate-600 shadow-sm flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-sm text-slate-700">帳戶安全與密碼</h4>
                  <p className="text-[11px] text-slate-500 font-medium">修改登入密碼</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">當前密碼</label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="請輸入目前密碼" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-slate-200 mt-1 font-bold text-sm" 
                />
              </div>
              <div className="h-px bg-slate-100 my-2" />
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">新密碼 (至少 6 個字元)</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="請輸入新密碼" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-slate-200 mt-1 font-bold text-sm" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">確認新密碼</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次輸入新密碼" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-slate-200 mt-1 font-bold text-sm" 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                返回
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-2/3 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isUpdating ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Key className="w-4 h-4" />}
                更新密碼
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
             <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center text-white mx-auto shadow-sm">
                <ShieldCheck className="w-8 h-8" />
             </div>
             <div>
                <h4 className="text-2xl font-black text-slate-800">密碼修改成功</h4>
                <p className="text-sm text-slate-500 mt-2 font-medium">您的新密碼已安全加密儲存，<br/>下次登入請使用新密碼。</p>
             </div>
             <button onClick={() => { setStep(1); onClose(); }} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">
                完成並關閉
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
