import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, Laptop, Heart, ArrowLeft, Package, Wallet, Shirt, Utensils, Music, User, UserX, Loader2, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProductImage } from "@/lib/productImages";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  school_id: string | null;
}

interface SchoolOption {
  id: string;
  name: string;
  location: string | null;
}

const OtherDonations = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [allSchools, setAllSchools] = useState<SchoolOption[]>([]);
  const [modalSchoolId, setModalSchoolId] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<"registered" | "anonymous">("anonymous");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [anonEmail, setAnonEmail] = useState("");
  const [anonName, setAnonName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchAllSchools();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      setDonationType("registered");
    }
  };

  const fetchAllSchools = async () => {
    const { data } = await supabase
      .from("schools")
      .select("id, name, location")
      .eq("status", "approved")
      .order("name");
    setAllSchools(data || []);
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

  const handleDonateClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomAmount("");
    setModalSchoolId(product.school_id || null);
    setShowDonationModal(true);
  };

  const processDonation = async () => {
    if (!selectedProduct) return;

    if (donationType === "anonymous" && !anonEmail) {
      toast({ title: "Email Required", description: "Please provide an email for donation confirmation", variant: "destructive" });
      return;
    }

    if (donationType === "registered" && !isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to donate with your account", variant: "destructive" });
      return;
    }

    setProcessing(true);

    try {
      const amount = customAmount ? parseFloat(customAmount) : selectedProduct.price * quantity;

      if (amount <= 0 || isNaN(amount)) {
        toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
        setProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("process-donation", {
        body: {
          productId: selectedProduct.id,
          amount,
          quantity,
          schoolId: modalSchoolId || selectedProduct.school_id,
          isAnonymous: donationType === "anonymous",
          anonymousEmail: donationType === "anonymous" ? anonEmail : undefined,
          anonymousName: donationType === "anonymous" ? anonName : undefined,
        },
      });

      if (error) throw error;

      toast({ title: "Donation Initiated! 💖", description: `Processing $${amount.toLocaleString()}` });
      setShowDonationModal(false);
      setAnonEmail("");
      setAnonName("");

      if (data?.paymentUrl) window.open(data.paymentUrl, "_blank");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to process", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      books: <Book className="w-6 h-6 text-white" />,
      technology: <Laptop className="w-6 h-6 text-white" />,
      uniforms: <Shirt className="w-6 h-6 text-white" />,
      meals: <Utensils className="w-6 h-6 text-white" />,
      music: <Music className="w-6 h-6 text-white" />,
      stationery: <Book className="w-6 h-6 text-white" />,
    };
    return icons[category] || <Package className="w-6 h-6 text-white" />;
  };

  const formatUSD = (amount: number) => `$${amount.toLocaleString()}`;

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
              Support Kenyan schools with books, uniforms, meals, music instruments and more
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
                <Card key={product.id} className="card-project overflow-hidden">
                  <div className="h-40 overflow-hidden relative">
                    <img 
                      src={getProductImage(product.name, product.category, product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                      {getCategoryIcon(product.category)}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{formatUSD(product.price)}</span>
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

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Complete Your Donation</DialogTitle>
            <DialogDescription>{selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              {/* Product Info */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                <p className="text-primary font-bold mt-1">${selectedProduct.price.toFixed(2)} each</p>
              </div>

              {/* School Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <School className="w-4 h-4" />
                  Select School to Receive Donation *
                </Label>
                <Select
                  value={modalSchoolId || ""}
                  onValueChange={(value) => setModalSchoolId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a school..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}{school.location ? ` — ${school.location}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Donation Type */}
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
                      Donate without creating an account. Just provide your email for the receipt.
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Name (Optional)</Label>
                        <Input placeholder="Your name" value={anonName} onChange={(e) => setAnonName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" placeholder="your@email.com" value={anonEmail} onChange={(e) => setAnonEmail(e.target.value)} required />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="registered" className="mt-4">
                  {isAuthenticated ? (
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        <span className="font-medium text-accent">Logged in</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Your donation will be linked to your account</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/50 border text-center">
                      <p className="text-sm text-muted-foreground mb-3">Log in to track your donations</p>
                      <Button variant="outline" onClick={() => (window.location.href = "/auth?type=donor")}>Log In / Sign Up</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" max={selectedProduct.stock} value={quantity} onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value) || 1)); setCustomAmount(""); }} />
                <p className="text-sm text-muted-foreground">{formatUSD(selectedProduct.price)} each = {formatUSD(selectedProduct.price * quantity)} total</p>
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or custom amount</span></div>
              </div>
              <div className="space-y-2">
                <Label>Custom Amount (USD)</Label>
                <Input type="number" placeholder="Enter amount" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
              </div>

              {/* Total */}
              <div className="p-4 rounded-lg gradient-coral text-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-3xl font-extrabold">{formatUSD(customAmount ? parseFloat(customAmount || "0") : selectedProduct.price * quantity)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDonationModal(false)} disabled={processing}>Cancel</Button>
                <Button
                  className="flex-1 btn-primary"
                  onClick={processDonation}
                  disabled={processing || (donationType === "anonymous" && !anonEmail) || (donationType === "registered" && !isAuthenticated)}
                >
                  {processing ? (<><Loader2 className="mr-2 w-4 h-4 animate-spin" />Processing...</>) : (<><Wallet className="mr-2 w-4 h-4" />Donate Now</>)}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">Pay securely with Bitnob</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OtherDonations;
