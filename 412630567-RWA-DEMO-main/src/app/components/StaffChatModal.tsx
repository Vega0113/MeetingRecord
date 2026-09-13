import { X, Send, User, ShieldAlert, Loader2, MessageSquare, RefreshCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { RequestType, AppMode } from "../App";
import { useSystemControl } from "../context/SystemControlContext";

interface StaffChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activeRequest: RequestType;
  requestReason?: string;
  appMode: AppMode;
  isPaused: boolean; // 新增：判斷目前是否暫停
  onTriggerRequest: (type: RequestType, reason: string) => void;
}

export function StaffChatModal({
  isOpen,
  onClose,
  onConfirm,
  activeRequest,
  requestReason,
  appMode,
  isPaused,
  onTriggerRequest,
}: StaffChatModalProps) {
  const { chatMessages: messages, sendMessage } = useSystemControl();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTechnical = appMode === "TECHNICAL";
  const isBanker = appMode === "BUSINESS";
  const hasActiveRequest = activeRequest !== "NONE";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const sender = isBanker ? "BUSINESS" : "TECHNICAL";
    sendMessage(sender, inputValue);
    setInputValue("");
  };

  const handleTriggerActionRequest = () => {
    if (!isPaused) {
      // Current system is active, trigger PAUSE request
      onTriggerRequest("PAUSE_REQUEST", "業務端報告：偵測到市場異常波動，請求執行緊急暫停。");
      sendMessage("system", "緊急暫停請求已送出，等待技術端授權...");
    } else {
      // Current system is paused, trigger UNPAUSE request
      onTriggerRequest("UNPAUSE_REQUEST", "業務端報告：異常已排除且稽核完成，請求恢復交易。");
      sendMessage("system", "恢復交易請求已送出，等待技術端確認...");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBanker ? 'bg-purple-600' : 'bg-blue-600'} text-white shadow-sm`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-foreground uppercase">Collaboration Terminal</h3>
              <p className="text-[10px] text-muted-foreground font-bold">{appMode} SESSION // {isPaused ? 'STATUS: PAUSED' : 'STATUS: ACTIVE'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 dark:bg-transparent">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "system" ? "justify-center" : (
              (isBanker && message.sender === "BUSINESS") || (isTechnical && message.sender === "TECHNICAL") ? "justify-end" : "justify-start"
            )}`}>
              {message.sender === "system" ? (
                <div className="py-1 px-4 bg-muted/80 rounded-full text-[10px] font-black text-muted-foreground border border-border uppercase tracking-widest">
                  {message.content}
                </div>
              ) : (
                <div className={`max-w-[80%] flex flex-col ${
                  (isBanker && message.sender === "BUSINESS") || (isTechnical && message.sender === "TECHNICAL") ? "items-end" : "items-start"
                }`}>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium ${
                    (isBanker && message.sender === "BUSINESS") || (isTechnical && message.sender === "TECHNICAL")
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-card border border-border text-foreground rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-[9px] mt-1.5 opacity-40 font-mono">{message.timestamp.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-border bg-white dark:bg-card">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="輸入訊息..."
              className="flex-1 px-5 py-3 bg-muted/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-semibold"
            />
            <button onClick={handleSendMessage} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"><Send className="w-5 h-5" /></button>
          </div>

          <div className="flex gap-3">
            {/* Banker View: Toggle between Pause and Unpause Request */}
            {isBanker && !hasActiveRequest && (
              <button
                onClick={handleTriggerActionRequest}
                className={`flex-1 py-3 ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2`}
              >
                {isPaused ? <RefreshCcw className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                {isPaused ? '發送恢復交易請求 (RESTORE)' : '發送緊急暫停請求 (EMERGENCY)'}
              </button>
            )}

            {/* Technical View: Execute the approved action */}
            {isTechnical && hasActiveRequest && (
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 ${activeRequest === 'PAUSE_REQUEST' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all`}
              >
                授權執行: {activeRequest === 'PAUSE_REQUEST' ? 'EMERGENCY PAUSE' : 'RESTORE TRADING'}
              </button>
            )}

            {/* Status indicators */}
            {isBanker && hasActiveRequest && (
              <div className="flex-1 py-3 bg-muted rounded-xl text-muted-foreground text-[10px] font-bold uppercase flex items-center justify-center gap-2 border border-dashed border-border">
                <Loader2 className="w-3 h-3 animate-spin" />
                等待技術端處理中 (PENDING AUTH)
              </div>
            )}
            
            {isTechnical && !hasActiveRequest && (
              <div className="flex-1 py-3 bg-muted rounded-xl text-muted-foreground text-[10px] font-bold uppercase text-center border border-border">
                等待業務端請求...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
