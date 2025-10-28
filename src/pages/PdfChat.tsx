import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, FileText, MessageSquare, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";

interface PDF {
  id: string;
  name: string;
  uploadedAt: string;
  fileId: string;
}

export const PdfChat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        uploadedAt: pdf.uploaded_at,
        fileId: pdf.file_id,
      }));

      setPdfs(loadedPdfs);
    } catch (error: any) {
      console.error("Error loading PDFs:", error);
      toast.error("Failed to load PDFs");
    } finally {
      setLoading(false);
    }
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
      const fileId = crypto.randomUUID();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("fileId", fileId);

      const { data, error } = await supabase.functions.invoke("pdf-upload", {
        body: formData,
      });

      if (error) throw error;

      // Save to Supabase database
      const { data: pdfData, error: dbError } = await supabase
        .from("pdfs")
        .insert({
          user_id: user.id,
          file_id: fileId,
          name: file.name,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const newPdf: PDF = {
        id: pdfData.id,
        name: pdfData.name,
        uploadedAt: pdfData.uploaded_at,
        fileId: pdfData.file_id,
      };

      setPdfs([newPdf, ...pdfs]);
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
    try {
      const { error } = await supabase
        .from("pdfs")
        .delete()
        .eq("id", pdf.id);

      if (error) throw error;

      setPdfs(pdfs.filter((p) => p.id !== pdf.id));
      toast.success("PDF deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting PDF:", error);
      toast.error("Failed to delete PDF");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 relative overflow-hidden mt-16">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10 max-w-7xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Document Library
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Manage your PDF documents for AI-powered conversations
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload PDF
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => navigate("/pdf-chat-conversation")}
                size="lg"
                variant="outline"
                className="border-accent/30 hover:bg-accent/10 px-8"
                disabled={pdfs.length === 0}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Start Chatting
              </Button>
            </div>
          </div>

          {/* PDFs Grid */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
            </div>
          ) : pdfs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pdfs.map((pdf) => (
                <Card
                  key={pdf.id}
                  className="glass border-accent/20 hover:border-accent/40 transition-all group hover:shadow-lg hover:shadow-accent/10"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium truncate">{pdf.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePdf(pdf)}
                        className="hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        ID: {pdf.fileId.slice(0, 8)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="glass border-accent/20 rounded-2xl p-12 max-w-md mx-auto">
                <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No PDFs uploaded yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Upload your first PDF to start building your knowledge base
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
