import React, { createContext, useContext, useState, useEffect } from 'react';

interface HeartbeatContextType {
  tick: number; // 從啟動開始累計的秒數
}

const HeartbeatContext = createContext<HeartbeatContextType>({ tick: 0 });

export const useHeartbeat = () => useContext(HeartbeatContext);

export const HeartbeatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tick, setTick] = useState(0);
  const [isResyncing, setIsResyncing] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        // 只有當離開超過 10 秒才顯示這個動畫，避免頻繁切換分頁時覺得很煩
        if (hiddenAt && Date.now() - hiddenAt > 10000) {
          setIsResyncing(true);
          timeout = setTimeout(() => setIsResyncing(false), 2500);
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      // 只有在網頁處於可見狀態時才觸發心跳，避免在背景無意義發送 API 浪費額度
      if (!document.hidden) {
        setTick((prev) => prev + 1);
      }
    }, 1000); // 基準：每 1 秒跳動一次

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <HeartbeatContext.Provider value={{ tick }}>
      {children}
      
      {/* 甦醒同步提示 UI */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg font-bold tracking-wider text-xs flex items-center gap-3 transition-all duration-500 z-50 ${
          isResyncing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        歡迎回來，正在為您同步最新資料...
      </div>
    </HeartbeatContext.Provider>
  );
};
