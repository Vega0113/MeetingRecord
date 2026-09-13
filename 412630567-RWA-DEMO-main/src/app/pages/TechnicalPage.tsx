import React, { useRef, useState } from "react";
import { SystemHealthCard } from "../components/SystemHealthCard";
import { OracleMonitorCard } from "../components/OracleMonitorCard";
import { ContractControlCard } from "../components/ContractControlCard";
import { BlockchainDeployCard } from "../components/BlockchainDeployCard";
import { StaffStatusCard } from "../components/StaffStatusCard";
import { ThrottleTimerCard } from "../components/ThrottleTimerCard";
import { SystemLogsCard, SystemLogsCardHandle } from "../components/SystemLogsCard";
import { ReconcileModal } from "../components/ReconcileModal";
import { useSystemControl } from "../context/SystemControlContext";
import { useAuth } from "../context/AuthContext";

export function TechnicalPage() {
  const { userName } = useAuth();
  const { activeRequest, isPaused, throttleStartTime, activeTransactions, unreadCount, openChat } = useSystemControl();
  const logRef = useRef<SystemLogsCardHandle>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 text-slate-800">
      {activeRequest !== "NONE" && (
        <div className={`${activeRequest === 'PAUSE_REQUEST' ? 'bg-red-600' : 'bg-blue-600'} text-white p-5 rounded-xl flex items-center justify-between shadow-sm`}>
          <div className="flex items-center gap-3 font-bold uppercase tracking-wider text-sm">收到業務請求：【{activeRequest === 'PAUSE_REQUEST' ? '暫停' : '恢復'}】</div>
          <button onClick={openChat} className="bg-white text-slate-900 px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all shadow-sm uppercase">立即處理</button>
        </div>
      )}
      {/* 上排 3 核心監控卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SystemHealthCard />
        <OracleMonitorCard />
        <BlockchainDeployCard onLog={(type, message) => logRef.current?.addLog(type, message)} />
      </div>

      {/* 下排 2 重點操作卡片 (合約風控與跨部門審查通訊) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ContractControlCard 
          onPauseToggle={openChat} 
          onReconcile={() => setIsReconcileModalOpen(true)} 
          isPaused={isPaused} 
        />
        <StaffStatusCard onOpenChat={openChat} hasRequest={activeRequest !== "NONE"} unreadCount={unreadCount} userName={userName} requestType={activeRequest} />
      </div>
      <ThrottleTimerCard isActive={!isPaused} startTime={throttleStartTime} realActiveTransactions={activeTransactions} />
      <div className="pt-6 border-t border-border/50"><SystemLogsCard ref={logRef} /></div>

      {/* 全節點對帳與自動修復 Modal */}
      <ReconcileModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        onLog={(type, message) => logRef.current?.addLog(type, message)}
      />
    </div>
  );
}
