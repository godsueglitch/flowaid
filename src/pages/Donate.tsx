import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Package, ArrowRight, Check, Wallet } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
    // Show donation modal immediately - wallet connection will be handled inside
    setSelectedProduct(product);
    setQuantity(1);
    setCustomAmount("");
    setShowDonationModal(true);
  };

  const handleConnectWallet = () => {
    navigate("/auth?action=connect-wallet");
  };

  const processDonation = async () => {
    if (!selectedProduct) return;

    setProcessing(true);

    try {
      const amount = customAmount 
        ? parseFloat(customAmount) 
        : selectedProduct.price * quantity;

      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid donation amount",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to process payment via Bitnob
      const { data, error } = await supabase.functions.invoke("process-donation", {
        body: {
          productId: selectedProduct.id,
          amount: amount,
          quantity: quantity,
        },
      });

      if (error) throw error;

      toast({
        title: "Donation Initiated! 💖",
        description: `Processing your donation of $${amount.toFixed(2)}`,
      });

      setShowDonationModal(false);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <h1 className="text-5xl font-bold mb-4">Donate Sanitary Pads 🩷</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help provide essential hygiene products to girls in schools. Your donation directly impacts their health, dignity, and education.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="card-soft border-primary/20 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">2,450+</div>
              <p className="text-muted-foreground">Girls Helped</p>
            </CardContent>
          </Card>
          <Card className="card-soft border-accent/20 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-accent mb-2">15</div>
              <p className="text-muted-foreground">Schools Reached</p>
            </CardContent>
          </Card>
          <Card className="card-soft border-primary/20 text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">12,000+</div>
              <p className="text-muted-foreground">Pads Donated</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Choose Your Donation</h2>
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Donation</DialogTitle>
              <DialogDescription>
                {selectedProduct && `Donating ${selectedProduct.name}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-6 py-4">
                {/* Wallet Connection Section */}
                {!walletAddress ? (
                  <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full gradient-pink flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Connect Your Wallet</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect your wallet to complete the donation process
                      </p>
                    </div>
                    <Button
                      className="w-full btn-glow"
                      onClick={handleConnectWallet}
                    >
                      <Wallet className="mr-2 w-4 h-4" />
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Connected Wallet</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {walletAddress}
                    </p>
                  </div>
                )}

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
                        ? parseFloat(customAmount).toFixed(2) 
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
                    disabled={processing || !walletAddress}
                  >
                    {processing ? (
                      <>Processing...</>
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
