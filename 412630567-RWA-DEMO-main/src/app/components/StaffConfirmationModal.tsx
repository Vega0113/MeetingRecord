import { CheckCircle, X, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface StaffConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface ChecklistItem {
  id: number;
  label: string;
  description: string;
  checked: boolean;
}

export function StaffConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: StaffConfirmationModalProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 1,
      label: "已完成人工定價校正",
      description: "行員已使用 591 以外的實價資料驗證並修正價格",
      checked: false,
    },
    {
      id: 2,
      label: "已驗證資料庫同步狀態",
      description: "PostgreSQL 與鏈上資料已確認一致，無延遲或遺漏",
      checked: false,
    },
    {
      id: 3,
      label: "已確認無待處理的異常交易",
      description: "檢查近期交易紀錄，無可疑大額轉帳或異常操作",
      checked: false,
    },
  ]);

  const allChecked = checklist.every((item) => item.checked);

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleConfirm = () => {
    if (allChecked) {
      onConfirm();
      onClose();
      // Reset checklist
      setChecklist((prev) => prev.map((item) => ({ ...item, checked: false })));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            行員回報確認視窗
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              執行 UNPAUSE 前，請確認以下檢查項目已完成。這是防止 <strong>0206 事件</strong> 重演的關鍵機制。
            </p>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  item.checked
                    ? "border-green-500 bg-green-500/10"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.checked ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!allChecked && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                請勾選所有檢查項目後才能執行 UNPAUSE
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-md border border-border hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allChecked}
            className="flex-1 py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            確認並執行 UNPAUSE
          </button>
        </div>
      </div>
    </div>
  );
}
