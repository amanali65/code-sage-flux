import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <Code2 className="h-6 w-6 text-accent" />
            <span className="font-heading font-bold text-xl">AI Developer</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/chat")}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/chat") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => navigate("/pdf-chat")}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive("/pdf-chat") ? "text-accent" : "text-muted-foreground"
              }`}
            >
              PDF Chat
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
                  <User className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-accent/30 hover:bg-accent/5"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
