import { X, Upload, CheckCircle, FileText, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

interface KycResubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentStatus: string;
  rejectionReason?: string;
}

export function KycResubmitModal({
  isOpen,
  onClose,
  onSuccess,
  currentStatus,
  rejectionReason,
}: KycResubmitModalProps) {
  const { token } = useAuth();
  const [fileFront, setFileFront] = useState<File | null>(null);
  const [fileBack, setFileBack] = useState<File | null>(null);
  const [previewFront, setPreviewFront] = useState<string>("");
  const [previewBack, setPreviewBack] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const ALLOWED_EXT = ['.jpg', '.jpeg', '.png'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File, label: string) => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXT.includes(ext)) {
      return `${label}副檔名不合法 (${ext || '未知'})，僅接受 JPG 或 PNG 圖檔！`;
    }
    if (file.size > MAX_SIZE) {
      return `${label}檔案大小 (${(file.size / 1024 / 1024).toFixed(1)}MB) 超過 5MB 上限！`;
    }
    return null;
  };

  const handleClose = () => {
    if (isUploading) return;
    setFileFront(null);
    setFileBack(null);
    setPreviewFront("");
    setPreviewBack("");
    setErrorMsg("");
    setIsSuccess(false);
    onClose();
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFile(file, "身分證正面");
      if (err) {
        setErrorMsg(err);
        return;
      }
      setFileFront(file);
      setPreviewFront(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const err = validateFile(file, "身分證反面");
      if (err) {
        setErrorMsg(err);
        return;
      }
      setFileBack(file);
      setPreviewBack(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileFront || !fileBack) {
      setErrorMsg("請完整上傳身分證正面與反面兩張照片！");
      return;
    }

    const frontErr = validateFile(fileFront, "身分證正面");
    if (frontErr) { setErrorMsg(frontErr); return; }
    const backErr = validateFile(fileBack, "身分證反面");
    if (backErr) { setErrorMsg(backErr); return; }

    setIsUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("kyc_document", fileFront);
      formData.append("kyc_document_back", fileBack);

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/kyc/resubmit`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsSuccess(true);
        onSuccess?.(); // 即時觸發母頁面更新狀態
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setErrorMsg(data.message || "補繳失敗，請稍後再試");
      }
    } catch (err: any) {
      setErrorMsg("無法連線至伺服器，請檢查網路連線");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 點擊半透明背景關閉彈窗 */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={handleClose} 
      />

      <div className="relative z-10 bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Modal 頂部 Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
              {isSuccess ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800">
                {isSuccess ? "提交成功" : currentStatus === "REJECTED" ? "重新補繳 KYC 實名證件" : "上傳 KYC 實名認證雙證件"}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Identity Verification Resubmission
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">證件補繳提交成功</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                您的雙證件已安全加密上傳至雲端伺服器，銀行合規人員將於營業時間盡速為您重新審核。
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all"
            >
              完成並關閉
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* 退件原因提示框 */}
            {currentStatus === "REJECTED" && rejectionReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-red-800">行員退件審核備註：</h4>
                  <p className="text-xs font-bold text-red-600 mt-1 leading-relaxed">{rejectionReason}</p>
                  <p className="text-[11px] text-red-400 mt-1 font-medium">請依上述備註重新拍攝清晰、無反光的身分證件後再次提交。</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 雙證件上傳區 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 正面 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  身分證正面 (Front)
                </label>
                <label className="relative aspect-[1.5/1] bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center p-4 group cursor-pointer transition-all overflow-hidden">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFrontChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                  />
                  {previewFront ? (
                    <div className="relative w-full h-full">
                      <img src={previewFront} alt="Front preview" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-black">
                        點擊更換照片
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mx-auto group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">上傳身分證正面</p>
                      <p className="text-xs text-slate-500 font-medium">支援 JPG、PNG 格式 (最大 5MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {/* 反面 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  身分證反面
                </label>
                <label className="relative aspect-[1.5/1] bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center p-4 group cursor-pointer transition-all overflow-hidden">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleBackChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                  />
                  {previewBack ? (
                    <div className="relative w-full h-full">
                      <img src={previewBack} alt="Back preview" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-black">
                        點擊更換照片
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mx-auto group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">上傳身分證反面</p>
                      <p className="text-xs text-slate-500 font-medium">支援 JPG、PNG 格式 (最大 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 text-slate-500 text-xs font-medium">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
              <span>證件檔案將透過 AES-256 高強度加密儲存於專屬安全節點，僅供合規審查使用。</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="w-1/3 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs transition-all disabled:opacity-40"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isUploading || !fileFront || !fileBack}
                className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploading ? "正在加密上傳中..." : "確認並送交審核"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
