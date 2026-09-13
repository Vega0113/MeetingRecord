import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { RequestType } from '../App';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
}

interface SystemControlContextType {
  isPaused: boolean;
  throttleStartTime: Date | null;
  activeTransactions: number; // 🟢 新增：真實交易量
  isModalOpen: boolean;
  activeRequest: RequestType;
  requestReason: string;
  unreadCount: number;
  chatMessages: ChatMessage[];
  openChat: () => void;
  closeChat: () => void;
  triggerRequest: (type: RequestType, reason: string) => void;
  executeOperation: (onLog: (type: 'info'|'warning'|'error'|'success', msg: string) => void) => void;
  sendMessage: (sender: string, content: string) => Promise<void>;
}

const SystemControlContext = createContext<SystemControlContextType | undefined>(undefined);

export function SystemControlProvider({ children }: { children: ReactNode }) {
  const { apiFetch, token } = useAuth();
  const [isPaused, setIsPaused] = useState(false);
  const [throttleStartTime, setThrottleStartTime] = useState<Date | null>(null);
  const [activeTransactions, setActiveTransactions] = useState(0); // 🟢 新增狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<RequestType>("NONE");
  const [requestReason, setRequestReason] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 定期輪詢獲取最新聊天紀錄與系統狀態
  useEffect(() => {
    // 如果沒有 token，代表還沒登入，就不啟動輪詢，避免 401 錯誤導致無限踢出
    if (!token) return;

    let timer: any;

    const fetchSystemState = async () => {
      try {
        const res = await apiFetch('/api/system/state');
        if (res.ok) {
          const state = await res.json();
          // 加入除錯日誌，讓使用者可以看到有確實收到
          console.log("[SYNC] Received system state:", state);
          setIsPaused(state.isPaused);
          setThrottleStartTime(state.throttleStartTime ? new Date(state.throttleStartTime) : null);
          setActiveTransactions(state.activeTransactions || 0); // 🟢 更新真實交易量
          setActiveRequest(state.activeRequest);
          setRequestReason(state.requestReason);
        }
      } catch (e) {
        // fail silently
      }
    };

    if (isModalOpen) {
      const fetchChat = async () => {
        try {
          const res = await apiFetch('/api/chat');
          if (res.ok) {
            const data = await res.json();
            setChatMessages(data.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          }
        } catch (e) {
          console.error("Failed to fetch chat");
        }
      };
      
      const pollAll = () => {
         fetchChat();
         fetchSystemState();
      };
      
      pollAll(); // 立即抓一次
      timer = setInterval(pollAll, 2000); // 每 2 秒抓一次
    } else {
      // 就算沒打開聊天室，也要每 3 秒同步一次系統狀態 (以便觸發外面的 UI)
      fetchSystemState();
      timer = setInterval(fetchSystemState, 3000);
    }
    return () => clearInterval(timer);
  }, [isModalOpen, apiFetch, token]);

  const openChat = () => {
    setIsModalOpen(true);
    setUnreadCount(0);
  };

  const closeChat = () => setIsModalOpen(false);

  const sendMessage = async (sender: string, content: string) => {
    try {
      await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, content })
      });
      // 樂觀更新 (Optimistic UI)
      setChatMessages(prev => [...prev, { id: Date.now(), sender, content, timestamp: new Date() }]);
    } catch (e) {
      console.error("Failed to send message");
    }
  };

  const triggerRequest = async (type: RequestType, reason: string) => {
    try {
      await apiFetch('/api/system/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeRequest: type, requestReason: reason })
      });
      setActiveRequest(type);
      setRequestReason(reason);
      if (!isModalOpen) setUnreadCount(prev => prev + 1);
    } catch (e) {
       console.error("Failed to trigger request");
    }
  };

  const executeOperation = async (onLog: (type: 'info'|'warning'|'error'|'success', msg: string) => void) => {
    try {
      let nextIsPaused = isPaused;
      if (activeRequest === "PAUSE_REQUEST") {
        nextIsPaused = true;
        onLog("warning", `技術負責人已授權：合約正式暫停。`);
      } else if (activeRequest === "UNPAUSE_REQUEST") {
        nextIsPaused = false;
        onLog("success", `技術負責人已授權：系統恢復交易。`);
      }
      
      await apiFetch('/api/system/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: nextIsPaused, activeRequest: "NONE", requestReason: "" })
      });

      // 同步呼叫鏈上合約的 pause()/unpause()，讓「暫停」不只是資料庫旗標
      try {
        const chainRes = await apiFetch('/api/blockchain/pause-toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPaused: nextIsPaused })
        });
        if (chainRes.ok) {
          const result = await chainRes.json();
          onLog("info", `鏈上合約同步：${result.affected}/${result.total} 個代幣已${nextIsPaused ? '暫停' : '恢復'}`);
        }
      } catch (chainErr) {
        onLog("warning", "鏈上合約狀態同步失敗，僅資料庫層級生效");
      }

      setIsPaused(nextIsPaused);
      setActiveRequest("NONE");
      setIsModalOpen(false);
    } catch (e) {
       console.error("Failed to execute operation");
    }
  };

  return (
    <SystemControlContext.Provider value={{
      isPaused, throttleStartTime, isModalOpen, activeRequest, requestReason, unreadCount, chatMessages,
      openChat, closeChat, triggerRequest, executeOperation, sendMessage
    }}>
      {children}
    </SystemControlContext.Provider>
  );
}

export function useSystemControl() {
  const context = useContext(SystemControlContext);
  if (context === undefined) {
    throw new Error('useSystemControl must be used within a SystemControlProvider');
  }
  return context;
}
