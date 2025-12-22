import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Package, ArrowRight, Check, Wallet, User, UserX, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
  school_id: string | null;
}

interface DonationStats {
  totalGirls: number;
  totalSchools: number;
  totalPads: number;
}

const Donate = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [donationType, setDonationType] = useState<"registered" | "anonymous">("anonymous");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<DonationStats>({ totalGirls: 0, totalSchools: 0, totalPads: 0 });
  
  // Anonymous donor fields
  const [anonEmail, setAnonEmail] = useState("");
  const [anonName, setAnonName] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchStats();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      setUserId(user.id);
      setDonationType("registered");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single();
      
      if (profile?.wallet_address) {
        setWalletAddress(profile.wallet_address);
      }
    }
  };

  const fetchStats = async () => {
    // Fetch real stats from database
    const { data: schools } = await supabase
      .from("schools")
      .select("students_count, total_received");
    
    const { data: donations } = await supabase
      .from("donations")
      .select("quantity")
      .eq("status", "completed");
    
    const totalGirls = schools?.reduce((acc, s) => acc + (s.students_count || 0), 0) || 0;
    const totalSchools = schools?.length || 0;
    const totalPads = donations?.reduce((acc, d) => acc + (d.quantity || 1), 0) || 0;
    
    setStats({ totalGirls, totalSchools, totalPads });
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", "sanitary_pads")
      .order("is_featured", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDonateClick = async (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomAmount("");
    setShowDonationModal(true);
  };

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    
    if (typeof ethereum !== "undefined") {
      try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        const address = accounts[0];
        setWalletAddress(address);
        
        // Save to profile if authenticated
        if (userId) {
          await supabase
            .from("profiles")
            .update({ wallet_address: address })
            .eq("id", userId);
        }
        
        toast({
          title: "Wallet Connected!",
          description: `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      } catch (error: any) {
        toast({
          title: "Connection Failed",
          description: error.message || "Could not connect to wallet",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
    }
  };

  const processDonation = async () => {
    if (!selectedProduct) return;

    // Validate wallet
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to proceed",
        variant: "destructive",
      });
      return;
    }

    // Validate anonymous donor info
    if (donationType === "anonymous" && !anonEmail) {
      toast({
        title: "Email Required",
        description: "Please provide an email for donation confirmation",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const amount = customAmount 
        ? parseFloat(customAmount) 
        : selectedProduct.price * quantity;

      if (amount <= 0 || isNaN(amount)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid donation amount",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Call edge function to process payment via Bitnob
      const { data, error } = await supabase.functions.invoke("process-donation", {
        body: {
          productId: selectedProduct.id,
          amount: amount,
          quantity: quantity,
          schoolId: selectedProduct.school_id,
          isAnonymous: donationType === "anonymous",
          anonymousEmail: donationType === "anonymous" ? anonEmail : undefined,
          anonymousName: donationType === "anonymous" ? anonName : undefined,
          walletAddress: walletAddress,
        },
      });

      if (error) throw error;

      toast({
        title: "Donation Initiated!",
        description: `Processing your donation of $${amount.toFixed(2)}`,
      });

      setShowDonationModal(false);
      setAnonEmail("");
      setAnonName("");

      // Redirect to payment page
      if (data?.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process donation",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-pink mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Donate Sanitary Pads</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help provide essential hygiene products to girls in schools. Your donation directly impacts their health, dignity, and education.
          </p>
        </div>

        {/* Impact Stats - Real Data */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="card-soft border-primary/20 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {stats.totalGirls.toLocaleString()}+
              </div>
              <p className="text-muted-foreground">Girls Helped</p>
            </CardContent>
          </Card>
          <Card className="card-soft border-accent/20 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-accent mb-2">
                {stats.totalSchools}
              </div>
              <p className="text-muted-foreground">Schools Reached</p>
            </CardContent>
          </Card>
          <Card className="card-soft border-primary/20 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {stats.totalPads.toLocaleString()}+
              </div>
              <p className="text-muted-foreground">Pads Donated</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Choose Your Donation</h2>
          
          {products.length === 0 ? (
            <Card className="card-soft p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Available</h3>
              <p className="text-muted-foreground mb-4">
                Check back soon for donation opportunities or contact us for direct donations.
              </p>
              <Button onClick={() => navigate("/schools")}>
                View Schools
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="card-soft overflow-hidden">
                  <div className="gradient-mixed h-32 flex items-center justify-center">
                    <Package className="w-16 h-16 text-white" />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                        <CardDescription className="text-base">
                          {product.description}
                        </CardDescription>
                      </div>
                      {product.is_featured && (
                        <span className="badge-primary text-xs px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-primary">
                        ${product.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.stock} in stock
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Provides monthly supply for one girl</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Direct delivery to schools</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Track your impact in real-time</span>
                      </div>
                    </div>

                    <Button
                      className="w-full btn-glow"
                      size="lg"
                      onClick={() => handleDonateClick(product)}
                      disabled={product.stock === 0}
                    >
                      <Heart className="mr-2 w-5 h-5" />
                      Donate Now
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Other Donations CTA */}
        <Card className="card-soft gradient-mixed text-white text-center">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Looking for other ways to help?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Explore our store for educational materials, school supplies, and more ways to make an impact.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/other-donations")}
              className="btn-glow"
            >
              View Other Donations
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Donation Modal */}
        <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Your Donation</DialogTitle>
              <DialogDescription>
                {selectedProduct && `Donating ${selectedProduct.name}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-6 py-4">
                {/* Donation Type Selection */}
                <Tabs value={donationType} onValueChange={(v) => setDonationType(v as "registered" | "anonymous")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="anonymous" className="flex items-center gap-2">
                      <UserX className="w-4 h-4" />
                      Anonymous
                    </TabsTrigger>
                    <TabsTrigger value="registered" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      With Account
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="anonymous" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground mb-4">
                        Donate without creating an account. We just need your email for the receipt.
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="anon-name">Name (Optional)</Label>
                          <Input
                            id="anon-name"
                            placeholder="Your name or leave blank"
                            value={anonName}
                            onChange={(e) => setAnonName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="anon-email">Email *</Label>
                          <Input
                            id="anon-email"
                            type="email"
                            placeholder="your@email.com"
                            value={anonEmail}
                            onChange={(e) => setAnonEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="registered" className="space-y-4 mt-4">
                    {isAuthenticated ? (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          <span className="font-medium text-primary">Logged in</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your donation will be linked to your account
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Log in to track your donations and impact
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate("/auth?type=donor")}
                        >
                          Log In / Sign Up
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Wallet Connection */}
                <div className="space-y-2">
                  <Label>Payment Wallet</Label>
                  {walletAddress ? (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Connected</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {walletAddress}
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={connectWallet}
                    >
                      <Wallet className="mr-2 w-4 h-4" />
                      Connect Wallet
                    </Button>
                  )}
                </div>

                {/* Quantity Selection */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (Packs)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                      setCustomAmount("");
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    ${selectedProduct.price} per pack = ${(selectedProduct.price * quantity).toFixed(2)} total
                  </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Custom Amount (USD)</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter any amount you'd like to donate
                  </p>
                </div>

                {/* Total Display */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Donation:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${customAmount 
                        ? parseFloat(customAmount || "0").toFixed(2) 
                        : (selectedProduct.price * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDonationModal(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 btn-glow"
                    onClick={processDonation}
                    disabled={processing || !walletAddress || (donationType === "anonymous" && !anonEmail)}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 w-4 h-4" />
                        Confirm Donation
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Donate;