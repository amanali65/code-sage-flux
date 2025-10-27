import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Plus, 
  Settings, 
  Brain, 
  User, 
  Menu,
  Home,
  MessageSquare,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved chat sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatSessions");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChatSessions(parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      })));
    }
  }, []);

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setStreamingMessage("");
    toast.success("New chat created");
  };

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setStreamingMessage("");
    }
  };

  const deleteChatSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
    toast.success("Chat deleted");
  };

  const updateCurrentSession = (newMessages: Message[]) => {
    if (!currentSessionId) {
      // Create new session if none exists
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: newMessages[0]?.content.slice(0, 30) + "..." || "New Chat",
        messages: newMessages,
        createdAt: new Date()
      };
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    } else {
      // Update existing session
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: newMessages,
              title: session.title === "New Chat" && newMessages.length > 0
                ? newMessages[0].content.slice(0, 30) + "..."
                : session.title
            }
          : session
      ));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateCurrentSession(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");

    try {
      // Call our backend edge function instead of direct n8n webhook
      const { data, error } = await supabase.functions.invoke('chat-proxy', {
        body: {
          message: userMessage.content,
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // Extract response from n8n webhook format [{ output: "..." }]
      let aiResponse = "I received your message, but couldn't generate a proper response.";
      if (Array.isArray(data) && data[0]?.output) {
        aiResponse = data[0].output;
      }
      
      // Simulate typing effect
      let currentText = "";
      
      for (let i = 0; i < aiResponse.length; i++) {
        currentText += aiResponse[i];
        setStreamingMessage(currentText);
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages);
      setStreamingMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-border bg-white overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-border">
          <Button 
            onClick={createNewChat}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {chatSessions.map((session) => (
              <div 
                key={session.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id 
                    ? "bg-accent/10 border border-accent/20" 
                    : "hover:bg-accent/5"
                }`}
                onClick={() => loadChatSession(session.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-sm truncate">{session.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatSession(session.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center px-4 gap-4 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            <h1 className="text-lg font-heading font-bold">AI Developer Assistant</h1>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && !streamingMessage && (
              <div className="text-center py-12 space-y-4">
                <Brain className="h-16 w-16 text-accent mx-auto opacity-50" />
                <h2 className="text-2xl font-heading font-bold">Start a conversation</h2>
                <p className="text-muted-foreground">Ask me anything about coding, logic, or development!</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-accent" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-sm"
                      : "bg-secondary rounded-bl-sm"
                  }`}
                >
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Message */}
            {streamingMessage && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-accent animate-pulse-glow" />
                </div>
                <div className="max-w-[80%] p-4 rounded-2xl bg-secondary rounded-bl-sm">
                  <div 
                    className="whitespace-pre-wrap inline"
                    dangerouslySetInnerHTML={{
                      __html: streamingMessage
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                  <span className="inline-block w-1 h-4 bg-accent ml-1 animate-pulse" />
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && !streamingMessage && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-accent animate-pulse-glow" />
                </div>
                <div className="p-4 rounded-2xl bg-secondary rounded-bl-sm">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-white p-4">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about coding..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 max-w-4xl mx-auto">
            Powered by n8n automation and AI
          </p>
        </div>
      </div>
    </div>
  );
};
