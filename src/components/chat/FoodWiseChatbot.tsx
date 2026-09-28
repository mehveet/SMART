import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RefreshCw,
  Bot,
  User,
  Trash2,
  ChevronDown,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  Package,
  Building2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-01',
  role: 'model',
  content: `Hello Chef & Operations Lead! 👋

I am your **SMART AI Operations Assistant** (Surplus Management And Redistribution Technology), powered by **Gemini 3.5 Flash**. I have real-time visibility over your facility's operations:

- **Staged Surplus Food Batches** & HACCP safety logs
- **Nearby NGO Partner Hubs**, capacities & transit corridors
- **FEFO Inventory Logistics** & near-expiry alerts
- **ML Demand Forecasts**, attendance & split-batch cooking schedules
- **Kitchen Waste Audits** & sustainability ESG metrics

Ask me any question below, or tap one of the suggested prompts to start!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  { icon: Package, text: 'What surplus food is staged right now?' },
  { icon: Building2, text: 'Which NGOs have free intake capacity?' },
  { icon: AlertTriangle, text: 'Show expiring inventory items (FEFO)' },
  { icon: TrendingUp, text: 'Explain tomorrow’s lunch demand forecast' },
  { icon: ShieldCheck, text: 'What are the HACCP temperature rules?' },
  { icon: Flame, text: 'How does split-batch cooking reduce waste?' },
];

export const FoodWiseChatbot: React.FC = () => {
  const {
    surplusBatches,
    partners,
    dispatches,
    inventory,
    wasteLogs,
    activeTab,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('foodwise_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Save conversation history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('foodwise_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll to bottom of message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Live facility context snapshot to empower chatbot to answer ANY question
  const liveFacilityContext = useMemo(() => {
    const available = surplusBatches.filter(b => b.status === 'Available');
    const availableKg = available.reduce((acc, curr) => acc + (curr.weightKg || curr.quantity || 0), 0);
    const delivered = surplusBatches.filter(b => b.status === 'Delivered');
    const recoveredKg = delivered.reduce((acc, curr) => acc + (curr.deliveryDetails?.deliveredKg || curr.weightKg || 0), 0);
    const critical = inventory.filter(i => i.shelfLifeStatus === 'critical' || i.shelfLifeStatus === 'expired' || i.shelfLifeStatus === 'near-term');
    const inTransit = dispatches.filter(d => d.status === 'In-Transit');

    return {
      facilityName: 'Campus Central Kitchen Commissary',
      activeTab,
      availableKg: availableKg.toFixed(1),
      availableBatchesCount: available.length,
      stagedBatchesList: available.map(
        b => `${b.foodName} (${(b.weightKg || 0).toFixed(1)}kg, ${b.portions} portions, storage: ${b.storageConditions}, deadline: ${b.collectionDeadline})`
      ),
      recoveredKg: recoveredKg.toFixed(1),
      partnersCount: partners.length,
      partnersList: partners.slice(0, 6).map(
        p => `${p.name} (${p.type}, intake cap: ${p.serviceCapacity}kg, allocated: ${p.allocatedTodayKg || 0}kg, location: ${p.location})`
      ),
      inTransitDispatchesCount: inTransit.length,
      criticalInventoryCount: critical.length,
      expiringItemsList: critical.map(
        i => `${i.name} (${i.currentStockKg}kg, expires: ${i.expiryDate}, storage: ${i.storageZone}, FEFO: ${i.fefoRecommendation})`
      ),
      recentWasteLogsCount: wasteLogs.length,
      totalWasteLoggedKg: wasteLogs.reduce((acc, curr) => acc + (curr.weightKg || curr.quantity || 0), 0).toFixed(1),
    };
  }, [surplusBatches, partners, dispatches, inventory, wasteLogs, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send multi-turn history & live facility context to backend Gemini proxy
      const payload = {
        messages: updatedMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        liveContext: liveFacilityContext,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.reply || 'I have analyzed your request. How else can I assist your operations?';
        const modelMessage: ChatMessage = {
          id: `mod-${Date.now()}`,
          role: 'model',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server responded with an error');
      }
    } catch (err: any) {
      console.warn('Chat request failed, providing local assistance:', err);
      const fallbackMessage: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        content: `I encountered a momentary connection interruption, but I can still assist with your local data:
- **Available Surplus:** **${liveFacilityContext.availableKg} kg** across ${liveFacilityContext.availableBatchesCount} batches.
- **Expiring Lots:** **${liveFacilityContext.criticalInventoryCount} items** prioritized for FEFO cooking.
- **Active NGO Hubs:** **${liveFacilityContext.partnersCount} partners** available within safe transit radar.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      localStorage.removeItem('foodwise_chat_history');
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  // Simple Markdown text renderer (handles bolding, lists, code, and headers cleanly)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1 flex items-center gap-1.5">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-slate-900 text-base mt-2.5 mb-1">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-emerald-700 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletText) }} />
              </div>
            );
          }

          // Numbered items
          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+)\.\s/)?.[1] || '1';
            const numText = trimmed.replace(/^\d+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 mt-1">
                <span className="text-emerald-800 font-bold font-mono text-[11px] bg-emerald-50 px-1 rounded border border-emerald-200">
                  {num}
                </span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numText) }} />
              </div>
            );
          }

          // Standard paragraph
          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
            />
          );
        })}
      </div>
    );
  };

  // Inline formatting for bold, italics, code
  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-slate-200/70 text-slate-800 font-mono text-[10px] rounded">$1</code>');
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 200);
          }}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 bg-emerald-800 hover:bg-emerald-900 text-white pl-3.5 pr-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border-2 border-emerald-600/60"
          title="Open SMART AI Operations Assistant"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-emerald-800 animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-emerald-800" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-['Plus_Jakarta_Sans'] tracking-tight">
                Ask SMART AI
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-200 block -mt-0.5">
              Instant operations intel
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal / Drawer Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-8 w-auto h-auto'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[480px] h-[640px] max-h-[88vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between gap-3 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white font-['Plus_Jakarta_Sans'] truncate">
                    SMART Operations AI
                  </h3>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-bold text-[9px] rounded-full border border-emerald-400/30 flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Gemini 3.5 Flash
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Live data: {liveFacilityContext.availableKg}kg staged · {liveFacilityContext.partnersCount} NGO hubs
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1 flex-shrink-0 text-slate-400">
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Carousel */}
          <div className="bg-slate-50 border-b border-slate-200/90 px-3 py-2 overflow-x-auto flex items-center gap-1.5 flex-shrink-0 no-scrollbar">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.text)}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                  <span>{prompt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map(msg => {
              const isBot = msg.role === 'model';
              const isCopied = isCopiedId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`relative group max-w-[85%] ${isBot ? '' : 'text-right'}`}>
                    <div
                      className={`p-3.5 rounded-2xl shadow-xs transition-all ${
                        isBot
                          ? 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                          : 'bg-emerald-800 text-white rounded-tr-xs text-left'
                      }`}
                    >
                      {isBot ? renderFormattedContent(msg.content) : <p className="text-xs leading-relaxed">{msg.content}</p>}
                    </div>

                    <div
                      className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 ${
                        isBot ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {isBot && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-700 cursor-pointer flex items-center gap-0.5"
                          title="Copy response"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Typing Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 justify-start animate-in fade-in">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Analyzing live facility data...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0 space-y-1.5">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about surplus, recipes, NGOs, FEFO, or forecasting..."
                  rows={2}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex-shrink-0 mb-0.5"
                title="Send message (Enter)"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.2 rounded border">Enter</kbd> to send, <kbd className="font-mono bg-slate-100 px-1 py-0.2 rounded border">Shift+Enter</kbd> for line</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> SMART Intelligence
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
