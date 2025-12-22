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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import schoolBooksImage from "@/assets/products/school-books.jpg";
import schoolUniformImage from "@/assets/products/school-uniform.jpg";
import schoolMealsImage from "@/assets/products/school-meals.jpg";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
}

const categoryImages: Record<string, string> = {
  books: schoolBooksImage,
  uniforms: schoolUniformImage,
  meals: schoolMealsImage,
};

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
        .maybeSingle();
      
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
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDonateClick = async (product: Product) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to make a donation", variant: "destructive" });
      navigate("/auth");
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
      const amount = customAmount ? parseFloat(customAmount) : selectedProduct.price * quantity;

      if (amount <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("process-donation", {
        body: { productId: selectedProduct.id, amount, quantity },
      });

      if (error) throw error;

      toast({ title: "Donation Initiated! 💖", description: `Processing KES ${amount.toLocaleString()}` });
      setShowDonationModal(false);

      if (data?.paymentUrl) window.open(data.paymentUrl, "_blank");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to process", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      books: <Book className="w-8 h-8 text-white" />,
      technology: <Laptop className="w-8 h-8 text-white" />,
      uniforms: <Shirt className="w-8 h-8 text-white" />,
      meals: <Utensils className="w-8 h-8 text-white" />,
    };
    return icons[category] || <Package className="w-8 h-8 text-white" />;
  };

  const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="pt-24 pb-12 gradient-hero">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate("/donate")} className="mb-6 text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Sanitary Pads
          </Button>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Other School Supplies 📚</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Support Kenyan schools with books, uniforms, meals and technology
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {products.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-6">Check back soon!</p>
                <Button onClick={() => navigate("/donate")} className="btn-primary">
                  <Heart className="mr-2 w-5 h-5" />
                  Donate Sanitary Pads
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="card-project">
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={product.image_url || categoryImages[product.category] || schoolBooksImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{formatKES(product.price)}</span>
                      <span className="text-sm text-muted-foreground">{product.stock} available</span>
                    </div>
                    <Button className="w-full btn-primary" onClick={() => handleDonateClick(product)} disabled={product.stock === 0}>
                      Donate Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Donation</DialogTitle>
            <DialogDescription>{selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              {walletAddress && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Connected Wallet</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{walletAddress}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" max={selectedProduct.stock} value={quantity} onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value) || 1)); setCustomAmount(""); }} />
                <p className="text-sm text-muted-foreground">{formatKES(selectedProduct.price)} each = {formatKES(selectedProduct.price * quantity)} total</p>
              </div>
              <div className="space-y-2">
                <Label>Or Custom Amount (KES)</Label>
                <Input type="number" placeholder="Enter amount" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatKES(customAmount ? parseFloat(customAmount) : selectedProduct.price * quantity)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDonationModal(false)} disabled={processing}>Cancel</Button>
                <Button className="flex-1 btn-primary" onClick={processDonation} disabled={processing}>
                  {processing ? "Processing..." : <><Heart className="mr-2 w-4 h-4" />Confirm</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OtherDonations;
