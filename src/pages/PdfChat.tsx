import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, FileText, Send, Brain, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";

interface PDF {
  id: string;
  name: string;
  uploadedAt: string;
  fileId: string; // Unique ID for n8n operations
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  pdfId: string;
  messages: Message[];
}

export const PdfChat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<PDF | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, streamingMessage]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user) {
      toast.error("Please sign in to upload PDFs");
      navigate("/auth");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setUploadLoading(true);
    try {
      const fileId = crypto.randomUUID(); // Generate unique ID
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("fileId", fileId);

      const { data, error } = await supabase.functions.invoke("pdf-upload", {
        body: formData,
      });

      if (error) throw error;

      const newPdf: PDF = {
        id: Date.now().toString(),
        name: file.name,
        uploadedAt: new Date().toISOString(),
        fileId: fileId,
      };

      setPdfs([...pdfs, newPdf]);
      toast.success("PDF uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload PDF");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePdf = async (pdf: PDF) => {
    if (!user) {
      toast.error("Please sign in to delete PDFs");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("pdf-delete", {
        body: { fileId: pdf.fileId, userId: user.id },
      });

      if (error) throw error;

      setPdfs(pdfs.filter((p) => p.id !== pdf.id));
      setConversations(conversations.filter((c) => c.pdfId !== pdf.id));
      if (selectedPdf?.id === pdf.id) {
        setSelectedPdf(null);
      }
      toast.success("PDF deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete PDF");
    }
  };

  const handleDeleteConversation = (pdfId: string) => {
    setConversations(conversations.filter((c) => c.pdfId !== pdfId));
    toast.success("Conversation deleted!");
  };

  const getCurrentConversation = () => {
    if (!selectedPdf) return null;
    return conversations.find((c) => c.pdfId === selectedPdf.id);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedPdf || loading) return;
    
    if (!user) {
      toast.error("Please sign in to chat with PDFs");
      navigate("/auth");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: currentMessage,
    };

    // Update conversation
    const existingConv = conversations.find((c) => c.pdfId === selectedPdf.id);
    if (existingConv) {
      setConversations(
        conversations.map((c) =>
          c.pdfId === selectedPdf.id ? { ...c, messages: [...c.messages, userMessage] } : c
        )
      );
    } else {
      setConversations([...conversations, { pdfId: selectedPdf.id, messages: [userMessage] }]);
    }

    setCurrentMessage("");
    setLoading(true);
    setStreamingMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("pdf-chat", {
        body: {
          fileId: selectedPdf.fileId,
          message: userMessage.content,
          userId: user.id,
        },
      });

      if (error) throw error;

      let aiResponse = "I received your message, but couldn't generate a proper response.";
      if (Array.isArray(data) && data[0]?.output) {
        aiResponse = data[0].output;
      }

      // Simulate typing effect
      let currentText = "";
      for (let i = 0; i < aiResponse.length; i++) {
        currentText += aiResponse[i];
        setStreamingMessage(currentText);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const aiMessage: Message = {
        role: "assistant",
        content: aiResponse,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.pdfId === selectedPdf.id ? { ...c, messages: [...c.messages, aiMessage] } : c
        )
      );
      setStreamingMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      // Remove the user message if there was an error
      setConversations((prev) =>
        prev.map((c) =>
          c.pdfId === selectedPdf.id
            ? { ...c, messages: c.messages.slice(0, -1) }
            : c
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const currentConv = getCurrentConversation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 relative overflow-hidden mt-16">
        {/* Background Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Upload Section */}
        <Card className="mb-8 glass border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-accent" />
              Upload PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                className="bg-accent hover:bg-accent/90"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose PDF File
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Upload a PDF to start chatting with it
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PDFs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <Card
              key={pdf.id}
              className="glass border-accent/20 hover:border-accent/50 transition-all cursor-pointer group"
              onClick={() => setSelectedPdf(pdf)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="truncate text-base">{pdf.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePdf(pdf);
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-accent hover:bg-accent/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPdf(pdf);
                    }}
                  >
                    Chat
                  </Button>
                  {conversations.find((c) => c.pdfId === pdf.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(pdf.id);
                      }}
                      className="border-accent/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pdfs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">No PDFs uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload a PDF to get started</p>
          </div>
        )}
        </div>
      </div>

      {/* Chat Dialog */}
      <Dialog open={!!selectedPdf} onOpenChange={() => setSelectedPdf(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col glass border-accent/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {selectedPdf?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {currentConv?.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mr-2 flex-shrink-0">
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
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                </div>
              </div>
            ))}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mr-2 flex-shrink-0">
                  <Brain className="h-4 w-4 text-accent animate-pulse-glow" />
                </div>
                <div className="max-w-[80%] p-4 rounded-2xl bg-secondary rounded-bl-sm">
                  <div
                    className="whitespace-pre-wrap inline"
                    dangerouslySetInnerHTML={{
                      __html: streamingMessage
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                  <span className="inline-block w-1 h-4 bg-accent ml-1 animate-pulse" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 bg-background/50">
            <div className="flex gap-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask something about this PDF..."
                className="flex-1 border-accent/20 focus:border-accent resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !currentMessage.trim()}
                className="bg-accent hover:bg-accent/90 self-end"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
