import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Laptop, Heart, ArrowLeft, Package } from "lucide-react";
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
  const [processing, setProcessing] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleDonate = async (product: Product) => {
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

    setProcessing(product.id);

    try {
      const { data, error } = await supabase.functions.invoke("process-donation", {
        body: {
          productId: product.id,
          amount: product.price,
          quantity: 1,
        },
      });

      if (error) throw error;

      toast({
        title: "Donation Initiated! 💖",
        description: `Processing your donation for ${product.name}`,
      });

      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process donation",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "books":
        return <Book className="w-8 h-8 text-white" />;
      case "technology":
        return <Laptop className="w-8 h-8 text-white" />;
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
                    onClick={() => handleDonate(product)}
                    disabled={processing === product.id || product.stock === 0}
                  >
                    {processing === product.id ? "Processing..." : "Donate Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OtherDonations;
