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
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

    if (!user) {
      toast.error("Please sign in to chat");
      navigate("/auth");
      return;
    }

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
        await new Promise(resolve => setTimeout(resolve, 5));
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
    <div className="flex h-screen bg-background flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isMobile ? 'absolute inset-y-0 left-0 z-40 w-64' : 'relative w-64'
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

            {messages.map((message, index) => (
              <div key={message.id} className="flex flex-col gap-2">
                <div
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
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Action Buttons - Only for assistant messages */}
                {message.role === "assistant" && (
                  <div className="flex gap-2 justify-start ml-12">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-accent/10 hover:text-accent"
                      onClick={() => toast.success("Liked!")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => toast.success("Disliked!")}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-accent/10 hover:text-accent"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => {
                          const blob = new Blob([message.content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `message-${index}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Exported as Text!");
                        }}>
                          Export as Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const json = JSON.stringify({ role: message.role, content: message.content }, null, 2);
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `message-${index}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Exported as JSON!");
                        }}>
                          Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const markdown = `**${message.role}:**\n\n${message.content}`;
                          const blob = new Blob([markdown], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `message-${index}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Exported as Markdown!");
                        }}>
                          Export as Markdown
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground inline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingMessage}
                    </ReactMarkdown>
                  </div>
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
    </div>
  );
};
