import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Heart, School, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get("type") || "donor";
  const [isLogin, setIsLogin] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const resolveDashboardPath = async (userId: string) => {
      // Determine if this user has a school record (do NOT rely on profile.role)
      const { data: school } = await supabase
        .from("schools")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      return school ? "/school/dashboard" : "/donor/dashboard";
    };

    // Check if user is already logged in
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const path = await resolveDashboardPath(session.user.id);
        navigate(path);
        return;
      }

      setCheckingSession(false);
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Defer navigation to avoid deadlock
        setTimeout(() => {
          resolveDashboardPath(session.user.id).then((path) => navigate(path));
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (typeof ethereum !== "undefined") {
      try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        toast.success("Wallet connected successfully!");
      } catch (error) {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } else {
      toast.error("MetaMask not detected. Please install MetaMask to connect your wallet.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Invalid input");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Update wallet address if connected
    if (walletAddress && data.user) {
      await supabase
        .from("profiles")
        .update({ wallet_address: walletAddress })
        .eq("id", data.user.id);
    }

    toast.success("Logged in successfully!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || "Invalid input");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please log in instead.");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    // Update wallet address if connected
    if (walletAddress && data.user) {
      await supabase
        .from("profiles")
        .update({ wallet_address: walletAddress })
        .eq("id", data.user.id);
    }

    toast.success("Account created successfully!");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mixed">
      <Card className="w-full max-w-md card-soft border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-pink flex items-center justify-center">
            {userType === "donor" ? (
              <Heart className="w-8 h-8 text-white" />
            ) : (
              <School className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              {userType === "donor" ? "Donor Portal" : "School Portal"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isLogin ? "Welcome back!" : "Create your account"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                
                {/* Wallet Connection */}
                <div className="space-y-3 pt-2">
                  {walletAddress ? (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">Wallet Connected</p>
                        <p className="text-xs text-muted-foreground truncate">{walletAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={connectWallet}
                      disabled={loading}
                    >
                      <Wallet className="mr-2 w-5 h-5" />
                      Connect Wallet (Optional)
                    </Button>
                  )}
                </div>

                <Button type="submit" className="w-full btn-glow" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Login
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {userType === "donor" ? "Full Name" : "School Name"}
                  </Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Enter name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    disabled={loading}
                  />
                </div>
                
                {/* Wallet Connection */}
                <div className="space-y-3 pt-2">
                  {walletAddress ? (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">Wallet Connected</p>
                        <p className="text-xs text-muted-foreground truncate">{walletAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={connectWallet}
                      disabled={loading}
                    >
                      <Wallet className="mr-2 w-5 h-5" />
                      Connect Wallet (Optional)
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Your wallet will be used for secure transactions
                  </p>
                </div>

                <Button type="submit" className="w-full btn-glow" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;