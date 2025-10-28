import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, FileText, ThumbsUp, ThumbsDown, Download, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

interface PDF {
  id: string;
  name: string;
  fileId: string;
}

export const PdfChatConversation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadPdfs(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadPdfs(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPdfs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("pdfs")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      const loadedPdfs: PDF[] = data.map((pdf) => ({
        id: pdf.id,
        name: pdf.name,
        fileId: pdf.file_id,
      }));

      setPdfs(loadedPdfs);
    } catch (error: any) {
      console.error("Error loading PDFs:", error);
      toast.error("Failed to load PDFs");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const typeMessage = async (content: string) => {
    const words = content.split(" ");
    let displayedContent = "";

    for (let i = 0; i < words.length; i++) {
      displayedContent += (i > 0 ? " " : "") + words[i];
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: displayedContent,
          isTyping: true,
        };
        return newMessages;
      });
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    setMessages((prev) => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = {
        role: "assistant",
        content: displayedContent,
        isTyping: false,
      };
      return newMessages;
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!user) {
      toast.error("Please sign in to chat");
      navigate("/auth");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Get all fileIds from uploaded PDFs
      const fileIds = pdfs.map(pdf => pdf.fileId);

      const { data, error } = await supabase.functions.invoke("pdf-chat", {
        body: {
          fileId: fileIds.join(","), // Send all fileIds
          message: userMessage,
          userId: user.id,
        },
      });

      if (error) throw error;

      const response = data?.[0]?.output || data?.output || "Sorry, I couldn't process that.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isTyping: true },
      ]);

      await typeMessage(response);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex mt-16 overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className="w-64 border-r border-border bg-muted/30 p-4">
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  setMessages([]);
                  toast.success("New conversation started");
                }}
              >
                + New Chat
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Chat with Your Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask questions about your {pdfs.length} uploaded PDF{pdfs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="mb-4">
                    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === "user" 
                          ? "bg-accent text-accent-foreground" 
                          : "glass border-accent/20"
                      }`}>
                        {msg.isTyping ? (
                          <span className="inline-block">{msg.content}</span>
                        ) : msg.role === "assistant" ? (
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                    
                    {msg.role === "assistant" && !msg.isTyping && (
                      <div className="flex gap-2 mt-2 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-accent/10"
                          onClick={() => toast.success("Liked!")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-accent/10"
                          onClick={() => toast.success("Disliked!")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-accent/10"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              toast.success("Exported as Text!");
                            }}>
                              Export as Text
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const json = JSON.stringify({ message: msg.content, timestamp: new Date().toISOString() }, null, 2);
                              navigator.clipboard.writeText(json);
                              toast.success("Exported as JSON!");
                            }}>
                              Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(`# AI Response\n\n${msg.content}`);
                              toast.success("Exported as Markdown!");
                            }}>
                              Export as Markdown
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border bg-background p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask about your documents..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-accent hover:bg-accent/90"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - PDFs */}
        <div className="w-64 border-l border-border bg-muted/30 p-4">
          <h2 className="text-lg font-semibold mb-4">Documents ({pdfs.length})</h2>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-2">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="p-3 rounded-lg glass border-accent/20 hover:border-accent/40 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-medium truncate">{pdf.name}</span>
                  </div>
                </div>
              ))}
              {pdfs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No documents uploaded yet
                </p>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate("/pdf-chat")}
              >
                Manage PDFs
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
