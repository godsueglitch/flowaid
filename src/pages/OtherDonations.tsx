import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book, Laptop, Heart, ArrowLeft, Package, Wallet, Shirt, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
}

const OtherDonations = () => {
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
      .neq("category", "sanitary_pads")
      .order("created_at", { ascending: false });

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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a donation",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!walletAddress) {
      toast({
        title: "Connect Your Wallet",
        description: "Please connect your wallet to continue",
      });
      navigate("/auth?action=connect-wallet");
      return;
    }

    setSelectedProduct(product);
    setQuantity(1);
    setCustomAmount("");
    setShowDonationModal(true);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "books":
        return <Book className="w-8 h-8 text-white" />;
      case "technology":
        return <Laptop className="w-8 h-8 text-white" />;
      case "uniforms":
        return <Shirt className="w-8 h-8 text-white" />;
      case "meals":
        return <Utensils className="w-8 h-8 text-white" />;
      default:
        return <Package className="w-8 h-8 text-white" />;
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
        <Button
          variant="ghost"
          onClick={() => navigate("/donate")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Sanitary Pads
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Other Donations 📚</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Support schools with educational materials, technology, and supplies
          </p>
        </div>

        {products.length === 0 ? (
          <Card className="card-soft text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No products available yet</h3>
              <p className="text-muted-foreground mb-6">
                Check back soon for more donation opportunities!
              </p>
              <Button onClick={() => navigate("/donate")} className="btn-glow">
                <Heart className="mr-2 w-5 h-5" />
                Donate Sanitary Pads Instead
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="card-soft">
                <div className="gradient-blue h-24 flex items-center justify-center">
                  {getCategoryIcon(product.category)}
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {product.stock} available
                    </span>
                  </div>
                  <Button
                    className="w-full btn-glow"
                    onClick={() => handleDonateClick(product)}
                    disabled={product.stock === 0}
                  >
                    Donate Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Connected Wallet</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {walletAddress}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
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
                    ${selectedProduct.price} each = ${(selectedProduct.price * quantity).toFixed(2)} total
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

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
                </div>

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
                    disabled={processing}
                  >
                    {processing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Heart className="mr-2 w-4 h-4" />
                        Confirm
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

export default OtherDonations;
