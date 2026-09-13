import { useEffect, useState, useCallback } from "react";
import { Rocket, Link2, Loader2, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface BlockchainStatus {
  nodeReachable: boolean;
  artifactsCompiled: boolean;
  adminWallet: string | null;
  infraDeployed: boolean;
  identityRegistry: string | null;
  properties: { id: number; title: string; tokenAddress: string | null }[];
}

interface BlockchainDeployCardProps {
  onLog?: (type: "info" | "success" | "warning" | "error", message: string) => void;
}

export function BlockchainDeployCard({ onLog }: BlockchainDeployCardProps) {
  const { apiFetch } = useAuth();
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/blockchain/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // 節點/後端離線時保持沉默，卡片會顯示上一次已知狀態
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    onLog?.("info", "已送出區塊鏈基礎設施部署請求，開始開通流程...");
    try {
      const res = await apiFetch("/api/blockchain/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "部署失敗");
      onLog?.(
        "success",
        `部署完成：${data.propertyTokens?.length ?? 0} 個代幣、${data.registeredUsers?.length ?? 0} 位用戶已登記`,
      );
      await fetchStatus();
    } catch (e: any) {
      setError(e.message || "部署失敗");
      onLog?.("error", `區塊鏈部署失敗: ${e.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const infraDeployed = status?.infraDeployed ?? false;
  const nodeReachable = status?.nodeReachable ?? false;

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ring-1 ring-slate-100">
      <div className="p-6 border-b border-border bg-slate-50/50 flex items-center justify-between">
        <h3 className="font-black flex items-center gap-2.5 text-base text-slate-800">
          <Link2 className="w-5 h-5 text-indigo-600" />
          區塊鏈核心 (ERC-3643)
        </h3>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            nodeReachable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {nodeReachable ? "節點在線" : "節點離線"}
        </span>
      </div>

      <div className="p-8 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            {status?.artifactsCompiled ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span className="text-slate-600">合約已編譯</span>
          </div>
          <div className="flex items-center gap-2">
            {infraDeployed ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-yellow-500 shrink-0" />
            )}
            <span className="text-slate-600">基礎設施就緒</span>
          </div>
        </div>

        {status?.adminWallet && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
            <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate font-mono">{status.adminWallet}</span>
          </div>
        )}

        {status?.properties && status.properties.length > 0 && (
          <div className="space-y-1.5 max-h-24 overflow-y-auto text-xs">
            {status.properties.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-slate-600 truncate font-medium">{p.title}</span>
                <span className={p.tokenAddress ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                  {p.tokenAddress ? `${p.tokenAddress.slice(0, 8)}…` : "未鑄造"}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <button
          onClick={handleDeploy}
          disabled={isDeploying || !nodeReachable}
          className="mt-auto w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 部署中...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" /> {infraDeployed ? "重新執行部署" : "執行區塊鏈開通"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
