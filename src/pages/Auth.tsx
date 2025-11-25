import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Heart, School } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userType = searchParams.get("type") || "donor";
  const [isLogin, setIsLogin] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = async () => {
    // Simulating wallet connection
    const ethereum = (window as any).ethereum;
    if (typeof ethereum !== "undefined") {
      try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        toast.success("Wallet connected successfully!");
      } catch (error) {
        toast.error("Failed to connect wallet. Using demo mode.");
        // Demo mode
        const demoAddress = "0x" + Math.random().toString(16).substr(2, 40);
        setWalletAddress(demoAddress);
        setWalletConnected(true);
      }
    } else {
      toast.info("MetaMask not detected. Using demo mode.");
      // Demo mode for users without MetaMask
      const demoAddress = "0x" + Math.random().toString(16).substr(2, 40);
      setWalletAddress(demoAddress);
      setWalletConnected(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    toast.success(`Successfully ${isLogin ? "logged in" : "registered"}!`);
    
    // Navigate based on user type
    if (userType === "donor") {
      navigate("/donor/dashboard");
    } else {
      navigate("/school/dashboard");
    }
  };

  useEffect(() => {
    // Auto-connect wallet prompt on mount
    const timer = setTimeout(() => {
      if (!walletConnected) {
        toast.info("Connect your wallet to continue", {
          action: {
            label: "Connect",
            onClick: connectWallet,
          },
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [walletConnected]);

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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" required />
                </div>
                
                {/* Wallet Connection */}
                <div className="space-y-3 pt-2">
                  {walletConnected ? (
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
                    >
                      <Wallet className="mr-2 w-5 h-5" />
                      Connect Wallet
                    </Button>
                  )}
                </div>

                <Button type="submit" className="w-full btn-glow" size="lg">
                  Login
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {userType === "donor" ? "Full Name" : "School Name"}
                  </Label>
                  <Input id="name" type="text" placeholder="Enter name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" required />
                </div>
                
                {/* Wallet Connection */}
                <div className="space-y-3 pt-2">
                  {walletConnected ? (
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
                    >
                      <Wallet className="mr-2 w-5 h-5" />
                      Connect Wallet
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Your wallet will be used for secure transactions
                  </p>
                </div>

                <Button type="submit" className="w-full btn-glow" size="lg">
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
