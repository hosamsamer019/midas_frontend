"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, MessageCircle, X, Trash2, Loader2, Copy, Share2, Volume2, Mic } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useTheme } from "@/context/ThemeContext";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources?: Array<{
    content: string;
    source: string;
    score: number;
  }>;
  isStreaming?: boolean;
}

interface QuickAction {
  id: string;
  label_ar: string;
  label_en: string;
  icon: string;
}

const API_BASE_URL = '';

const QUICK_ACTIONS = [
  { id: 'overview', label_ar: 'نظرة عامة', label_en: 'System Overview', icon: 'chart' },
  { id: 'top_bacteria', label_ar: 'البacteria الشائعة', label_en: 'Common Bacteria', icon: 'bacteria' },
  { id: 'resistance_trends', label_ar: 'اتجاهات المقاومة', label_en: 'Resistance Trends', icon: 'trending' },
  { id: 'department_stats', label_ar: 'إحصائياتقسام', label_en: 'Dept Statistics', icon: 'building' },
  { id: 'recent_samples', label_ar: 'أحدث العينات', label_en: 'Recent Samples', icon: 'clock' },
  { id: 'usage_guide', label_ar: 'دليل الاستخدام', label_en: 'How to Use', icon: 'help' },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const { isDarkMode } = useTheme();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/chatbot/history/?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const historyMessages: Message[] = data.map((item: any) => [
          {
            id: `${item.id}-user`,
            text: item.message,
            sender: "user" as const,
            timestamp: new Date(item.timestamp),
          },
          {
            id: `${item.id}-bot`,
            text: item.response,
            sender: "bot" as const,
            timestamp: new Date(item.timestamp),
            sources: item.sources,
          },
        ]).flat();
        
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const clearHistory = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع الرسائل؟")) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/api/chatbot/clear_history/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const speakText = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("المتصفح لا يدعم التعرف على الصوت");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const sendQuickAction = async (actionId: string) => {
    const actionMessages: Record<string, { ar: string; en: string }> = {
      compare_antibiotics: { 
        ar: 'قارن بين Vancomycin و Meropenem', 
        en: 'Compare Vancomycin and Meropenem' 
      },
      resistance_trends: {
        ar: 'ما هي اتجاهات المقاومة في المستشفى؟',
        en: 'What are the resistance trends in the hospital?'
      },
      find_alternatives: {
        ar: 'ما بدائل المضادات الحيوية للحساسية؟',
        en: 'What are alternatives for antibiotic allergies?'
      },
      drug_interactions: {
        ar: 'ما التداخلات الدوائية الشائعة؟',
        en: 'What are common drug interactions?'
      },
      dosage_guide: {
        ar: 'ما الجرعات المعتادة للمضادات؟',
        en: 'What are the usual dosages for antibiotics?'
      },
      guidelines: {
        ar: 'ما إرشادات CLSI للتفسير؟',
        en: 'What are the CLSI guidelines for interpretation?'
      },
    };

    const message = actionMessages[actionId]?.[language] || actionMessages[actionId]?.ar || '';
    
    if (useStreaming) {
      await sendMessageStreaming(message);
    } else {
      await sendMessageStandard(message);
    }
  };

  const sendMessageStreaming = async (userMessageText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, botMessage]);

    try {
      const token = localStorage.getItem("access_token");
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${API_BASE_URL}/api/chatbot/stream_chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessageText }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.");
        }
        console.warn(`Streaming endpoint returned ${response.status}. Falling back to standard chat.`);
        await sendMessageStandard(userMessageText, botMessageId);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("لا يمكن قراءة الاستجابة");
      }

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                fullText += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? { ...msg, text: fullText }
                      : msg
                  )
                );
              }

              if (data.done) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Request aborted");
      } else {
        console.error("Streaming error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  text: error.message || "عذراً، حدث خطأ في إرسال الرسالة. الرجاء المحاولة مرة أخرى.",
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const sendMessageStandard = async (userMessageText: string, existingBotMessageId?: string) => {
    if (!existingBotMessageId) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: userMessageText,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");
      setIsLoading(true);
    }

    const botMessageId = existingBotMessageId || (Date.now() + 1).toString();

    if (existingBotMessageId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === existingBotMessageId
            ? { ...msg, text: "جارٍ المعالجة...", isStreaming: true }
            : msg
        )
      );
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_BASE_URL}/api/chatbot/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessageText }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.");
        }
        throw new Error(`خطأ في الخادم (${response.status}). الرجاء المحاولة مرة أخرى.`);
      }

      const data = await response.json();

      const replyText = data.response || data.message || "لم أتمكن من الحصول على رد.";

      if (existingBotMessageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === existingBotMessageId
              ? { ...msg, text: replyText, isStreaming: false, sources: data.sources }
              : msg
          )
        );
      } else {
        const botMessage: Message = {
          id: botMessageId,
          text: replyText,
          sender: "bot",
          timestamp: new Date(),
          sources: data.sources,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errText = error.message || "عذراً، حدث خطأ في إرسال الرسالة. الرجاء المحاولة مرة أخرى.";
      if (existingBotMessageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === existingBotMessageId
              ? { ...msg, text: errText, isStreaming: false }
              : msg
          )
        );
      } else {
        const errorMessage: Message = {
          id: botMessageId,
          text: errText,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      if (!existingBotMessageId) {
        setIsLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();

    if (useStreaming) {
      await sendMessageStreaming(messageText);
    } else {
      await sendMessageStandard(messageText);
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-[450px] h-[650px] flex flex-col shadow-2xl border-2 ${
        isDarkMode 
          ? "bg-black border-gray-800" 
          : "bg-white border-gray-200"
      }`}>
        <CardHeader className={`flex flex-row items-center justify-between p-4 ${
          isDarkMode
            ? "bg-gray-900"
            : "bg-blue-600"
        } text-white`}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            المساعد الطبي الذكي
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 text-xs"
              title="تغيير اللغة"
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              title="حذف السجل"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col p-0 flex-1 overflow-hidden">
          {/* Quick Actions Bar */}
          <div className={`p-2 border-b ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex flex-wrap gap-1">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => sendQuickAction(action.id)}
                  disabled={isLoading}
                  className={`text-xs py-1 px-2 h-7 ${
                    isDarkMode 
                      ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" 
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {language === 'ar' ? action.label_ar : action.label_en}
                </Button>
              ))}
            </div>
          </div>

          <div
            className={`flex-1 p-4 overflow-y-auto ${
              isDarkMode ? "bg-black" : "bg-gray-50"
            }`}
            ref={scrollAreaRef}
          >
            {messages.length === 0 ? (
              <div className={`text-center mt-16 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>مرحباً بك!</p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : ""}`}>أنا مساعدك الطبي الذكي</p>
                <p className={`text-xs mt-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  يمكنني مساعدتك في:
                </p>
                <ul className={`text-xs mt-2 space-y-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  <li>• معلومات عن البكتيريا والمضادات الحيوية</li>
                  <li>• إرشادات استخدام النظام</li>
                  <li>• تفسير نتائج الاختبارات</li>
                  <li>• الإجابة على الأسئلة الطبية</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : isDarkMode
                            ? "bg-gray-900 text-gray-100 border border-gray-800"
                            : "bg-white text-gray-900 border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {message.sender === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {message.sender === "bot" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => speakText(message.text)}
                              className={`p-1 rounded hover:bg-gray-700 ${isSpeaking ? 'text-red-400' : ''}`}
                              title={isSpeaking ? "إيقاف" : "قراءة"}
                            >
                              <Volume2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => copyMessage(message.text)}
                              className="p-1 rounded hover:bg-gray-700"
                              title="نسخ"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {message.sender === "bot" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.text}
                        </p>
                      )}

                      {message.isStreaming && (
                        <div className="flex items-center gap-1 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs opacity-70">جارٍ الكتابة...</span>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && !message.isStreaming && (
                        <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                          <p className="text-xs font-semibold mb-2">المصادر:</p>
                          {message.sources.slice(0, 2).map((source, idx) => (
                            <div key={idx} className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              • {source.source}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && !useStreaming && (
                  <div className="flex justify-start">
                    <div className={`rounded-lg px-4 py-3 shadow-sm border ${
                      isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          جارٍ التفكير...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`p-4 border-t ${
            isDarkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
          }`}>
            <div className="flex gap-2 mb-2">
              <label className={`flex items-center gap-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="rounded"
                />
                استخدام الردود المباشرة
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={isLoading || isListening}
                className={`p-2 rounded-lg ${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}
                title={language === 'ar' ? 'إدخال صوتي' : 'Voice input'}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
              </button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب سؤالك هنا..."
                className={`flex-1 ${
                  isDarkMode 
                    ? "bg-gray-900 border-gray-700 text-white placeholder:text-gray-500" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                disabled={isLoading}
                dir="auto"
              />

              {isLoading && useStreaming ? (
                <Button
                  onClick={stopStreaming}
                  variant="destructive"
                  className="px-4"
                >
                  إيقاف
                </Button>
              ) : (
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

