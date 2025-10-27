import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Zap, Brain, Sparkles, MessageSquare, Github, Linkedin, Twitter, FileText } from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Code2,
      title: "Built for Developers",
      description: "Understands logic, structure, and real-world code like a human engineer."
    },
    {
      icon: Brain,
      title: "Powered by n8n Automation",
      description: "Connected to external APIs, tools, and custom nodes for intelligent responses."
    },
    {
      icon: Zap,
      title: "Fast & Smooth",
      description: "Instant response feel with typing simulation and seamless animations."
    },
    {
      icon: Sparkles,
      title: "Modern UI & Glow Design",
      description: "Orange-accented, futuristic layout that feels premium and polished."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Ask Anything",
      description: "Describe your coding problem or question in natural language."
    },
    {
      step: "2",
      title: "AI Developer Thinks",
      description: "The AI analyzes your prompt using connected tools via n8n."
    },
    {
      step: "3",
      title: "Get Developer-Style Insight",
      description: "Receive real, actionable answers like a human engineer would provide."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Glow Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl opacity-5 select-none">
            {"</>"}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-block px-4 py-2 bg-accent/10 rounded-full border border-accent/20 mb-4">
              <span className="text-sm font-medium text-accent">AI Developer Assistant</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-heading font-bold leading-tight">
              Meet Your Developer{" "}
              <span className="text-gradient">AI Assistant</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              An intelligent coding companion that thinks like a developer and helps you solve complex problems.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground glow-orange group"
                onClick={() => navigate("/chat")}
              >
                Start Chatting
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-accent/30 hover:bg-accent/5"
                onClick={() => navigate("/pdf-chat")}
              >
                <FileText className="mr-2 h-5 w-5" />
                PDF Chat
              </Button>
            </div>

            {/* Floating Code Animation */}
            <div className="pt-12 relative h-32">
              <div className="absolute left-1/4 top-0 animate-float opacity-50">
                <Code2 className="h-8 w-8 text-accent" />
              </div>
              <div className="absolute right-1/4 top-8 animate-float opacity-50" style={{ animationDelay: "1s" }}>
                <Code2 className="h-6 w-6 text-accent" />
              </div>
              <div className="absolute left-1/3 bottom-0 animate-float opacity-50" style={{ animationDelay: "2s" }}>
                <Code2 className="h-7 w-7 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get developer-quality answers in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((item, index) => (
              <div 
                key={index}
                className="glass p-8 rounded-2xl hover:scale-105 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-6 glow-orange group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <h3 className="text-2xl font-heading font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Powerful <span className="text-gradient">Features</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need in a modern AI coding assistant
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-accent/20"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              See It In <span className="text-gradient">Action</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how our AI assistant helps developers solve real problems
            </p>
          </div>

          <div className="max-w-4xl mx-auto glass p-8 rounded-3xl">
            <div className="space-y-4">
              {/* Demo User Message */}
              <div className="flex justify-end">
                <div className="bg-accent text-white px-6 py-3 rounded-2xl rounded-br-sm max-w-md">
                  How do I optimize a React component that re-renders too often?
                </div>
              </div>

              {/* Demo AI Response */}
              <div className="flex justify-start">
                <div className="bg-secondary px-6 py-3 rounded-2xl rounded-bl-sm max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-accent animate-pulse-glow" />
                    <span className="text-sm font-medium">AI Developer</span>
                  </div>
                  <p className="text-sm">
                    Great question! To optimize re-renders, consider using <code className="bg-accent/10 px-2 py-1 rounded text-accent">React.memo()</code>, <code className="bg-accent/10 px-2 py-1 rounded text-accent">useMemo()</code>, or <code className="bg-accent/10 px-2 py-1 rounded text-accent">useCallback()</code>. Let me show you...
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => navigate("/chat")}
              >
                Try Full Chat
                <MessageSquare className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                  Built by Developers,{" "}
                  <span className="text-gradient">For Developers</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  This AI assistant is powered by <strong>n8n automation</strong> combined with advanced language models, allowing it to interact with coding tools, databases, and even GitHub APIs.
                </p>
                <p className="text-lg text-muted-foreground">
                  It's not just a chatbot — it's an intelligent coding companion that understands your workflow and thinks through problems like a real engineer.
                </p>
              </div>
              
              <div className="relative">
                <div className="glass p-8 rounded-3xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent animate-pulse-glow" />
                      <span className="text-sm">n8n Workflow Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
                      <span className="text-sm">AI Model Connected</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "1s" }} />
                      <span className="text-sm">GitHub Integration Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-orange-500/10 to-accent/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-5xl md:text-6xl font-heading font-bold">
              Ready to Code <span className="text-gradient">Smarter?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Chat with your AI Developer now and experience the future of coding assistance.
            </p>
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground glow-orange-lg text-lg px-8 py-6"
              onClick={() => navigate("/chat")}
            >
              Launch Chat
              <Sparkles className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-heading font-bold text-2xl mb-2 flex items-center gap-2 justify-center md:justify-start">
                <Code2 className="h-6 w-6 text-accent" />
                AI Developer
              </h3>
              <p className="text-sm text-muted-foreground">
                Crafted by Aman Ali — Powered by n8n & AI
              </p>
            </div>

            <nav className="flex gap-6">
              <a href="/" className="text-sm hover:text-accent transition-colors">Home</a>
              <a href="/chat" className="text-sm hover:text-accent transition-colors">Chat</a>
              <a href="#about" className="text-sm hover:text-accent transition-colors">About</a>
              <a href="#contact" className="text-sm hover:text-accent transition-colors">Contact</a>
            </nav>

            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
