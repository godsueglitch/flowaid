import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Search, User, UserX, Loader2, Filter, Wallet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  image_url: string | null;
  is_featured: boolean | null;
  school_id: string | null;
  schools?: {
    name: string;
    location: string | null;
    students_count: number | null;
  } | null;
}

const Donate = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState<"registered" | "anonymous">("anonymous");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(searchParams.get("school"));
  const [selectedSchoolName, setSelectedSchoolName] = useState<string | null>(null);
  
  // Anonymous donor fields
  const [anonEmail, setAnonEmail] = useState("");
  const [anonName, setAnonName] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    const schoolId = searchParams.get("school");
    setSelectedSchoolId(schoolId);
    fetchProducts(schoolId);
    checkAuth();
    
    // Check if a specific product was requested
    const productId = searchParams.get("product");
    if (productId) {
      fetchProductById(productId);
    }
  }, [searchParams]);

  const fetchProductById = async (id: string) => {
    const { data } = await supabase
      .from("products")
      .select("*, schools(name, location, students_count)")
      .eq("id", id)
      .single();
    
    if (data) {
      setSelectedProduct(data);
      setShowDonationModal(true);
    }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      setUserId(user.id);
      setUserEmail(user.email || null);
      setDonationType("registered");
    }
  };

  const fetchProducts = async (schoolId?: string | null) => {
    let query = supabase
      .from("products")
      .select("*, schools(id, name, location, students_count)")
      .eq("category", "sanitary_pads")
      .order("is_featured", { ascending: false });

    // Filter by school if specified
    if (schoolId) {
      query = query.eq("school_id", schoolId);
      
      // Fetch school name
      const { data: school } = await supabase
        .from("schools")
        .select("name")
        .eq("id", schoolId)
        .single();
      
      if (school) {
        setSelectedSchoolName(school.name);
      }
    }

    const { data, error } = await query;

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

  const handleDonateClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCustomAmount("");
    setShowDonationModal(true);
  };

  const processDonation = async () => {
    if (!selectedProduct) return;

    // For anonymous donations, require email
    if (donationType === "anonymous" && !anonEmail) {
      toast({
        title: "Email Required",
        description: "Please provide an email for donation confirmation",
        variant: "destructive",
      });
      return;
    }

    // For registered donations, require login
    if (donationType === "registered" && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to donate with your account",
        variant: "destructive",
      });
      return;
    }

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

      const { data, error } = await supabase.functions.invoke("process-donation", {
        body: {
          productId: selectedProduct.id,
          amount: amount,
          quantity: quantity,
          schoolId: selectedProduct.school_id,
          isAnonymous: donationType === "anonymous",
          anonymousEmail: donationType === "anonymous" ? anonEmail : undefined,
          anonymousName: donationType === "anonymous" ? anonName : undefined,
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

  const filteredProducts = products.filter((p) =>
    searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.schools?.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {selectedSchoolName ? `${selectedSchoolName}'s Store` : "Donate Sanitary Pads"}
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {selectedSchoolName 
              ? `Support ${selectedSchoolName} by donating essential hygiene products.`
              : "Help provide essential hygiene products to girls in schools. Every donation keeps a girl in school."}
          </p>
          {selectedSchoolId && (
            <Button 
              variant="outline" 
              className="mt-4 border-white text-white hover:bg-white/10"
              onClick={() => window.location.href = "/donate"}
            >
              View All Schools
            </Button>
          )}
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search schools or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>{filteredProducts.length} projects found</span>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div key={product.id} onClick={() => handleDonateClick(product)} className="cursor-pointer">
                  <ProjectCard
                    id={product.id}
                    title={product.name}
                    description={product.description || "Help provide sanitary supplies to girls in need."}
                    schoolName={product.schools?.name || "Kenyan School"}
                    location={product.schools?.location || "Kenya"}
                    imageUrl={product.image_url}
                    amountNeeded={product.price * (product.stock || 100)}
                    amountRaised={product.price * Math.floor((product.stock || 100) * 0.3)}
                    isUrgent={product.is_featured || false}
                    studentsHelped={product.schools?.students_count || 0}
                    category="sanitary_pads"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Try adjusting your search." : "Check back soon for new projects!"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Complete Your Donation</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Supporting: ${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6 py-4">
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
                        <Label htmlFor="anon-name">Name (Optional)</Label>
                        <Input
                          id="anon-name"
                          placeholder="Your name"
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
                
                <TabsContent value="registered" className="mt-4">
                  {isAuthenticated ? (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-success" />
                        <span className="font-medium text-success">Logged in</span>
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
                        onClick={() => window.location.href = "/auth?type=donor"}
                      >
                        Log In / Sign Up
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Payment Info */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="font-medium">Connect Wallet</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to complete your donation via Bitnob. 
                  Supports card payments and cryptocurrency.
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Packs)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.stock || 100}
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or custom amount</span>
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Custom Amount (USD)</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>

              {/* Total */}
              <div className="p-4 rounded-lg gradient-coral text-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Donation:</span>
                  <span className="text-3xl font-extrabold">
                    ${customAmount 
                      ? parseFloat(customAmount || "0").toFixed(2) 
                      : (selectedProduct.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
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
                  className="flex-1 btn-primary"
                  onClick={processDonation}
                  disabled={processing || (donationType === "anonymous" && !anonEmail) || (donationType === "registered" && !isAuthenticated)}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 w-4 h-4" />
                      Donate Now
                    </>
                  )}
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

export default Donate;