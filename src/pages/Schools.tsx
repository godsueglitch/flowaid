import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, MapPin, Heart, Loader2, Store, Package, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import kenyaSchool1 from "@/assets/schools/kenya-school-1.jpg";
import kenyaSchool2 from "@/assets/schools/kenya-school-2.jpg";
import kenyaSchool3 from "@/assets/schools/kenya-school-3.jpg";
import kenyaSchool4 from "@/assets/schools/kenya-school-4.jpg";
import kenyaSchool5 from "@/assets/schools/kenya-school-5.jpg";

interface SchoolData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  students_count: number | null;
  total_received: number | null;
  image_url: string | null;
  products?: { id: string }[];
}

const schoolImages = [kenyaSchool1, kenyaSchool2, kenyaSchool3, kenyaSchool4, kenyaSchool5];

const Schools = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select("*, products(id)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load schools", variant: "destructive" });
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-24 pb-12 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            🇰🇪 Kenyan Schools
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Schools & Stores</h1>
          <p className="text-xl text-white/90 mb-6">Support Kenyan schools directly through their stores</p>
          <Link to="/register-school">
            <Button className="bg-white text-primary hover:bg-white/90 rounded-full">
              <Plus className="mr-2 w-4 h-4" />
              Register Your School
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : schools.length === 0 ? (
            <Card className="text-center py-12 max-w-md mx-auto">
              <CardContent>
                <School className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-bold mb-2">No schools yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to register your Kenyan school!</p>
                <Link to="/register-school">
                  <Button className="btn-primary">
                    <Plus className="mr-2 w-4 h-4" />
                    Register School
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schools.map((school, index) => (
                <Card key={school.id} className="card-project">
                  <div className="h-40 overflow-hidden relative">
                    <img 
                      src={school.image_url || schoolImages[index % schoolImages.length]}
                      alt={school.name}
                      className="w-full h-full object-cover"
                    />
                    {(school.products?.length || 0) > 0 && (
                      <div className="absolute top-3 right-3 badge-urgent">
                        <Store className="w-3 h-3 mr-1" />
                        {school.products?.length} items
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{school.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {school.description || "Empowering Kenyan students through education"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {school.location || "Kenya"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {school.students_count || 0} girls
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Total Received</div>
                          <div className="text-2xl font-bold text-primary">
                            {formatUSD(school.total_received || 0)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">Store Items</div>
                          <div className="text-2xl font-bold text-accent flex items-center gap-1">
                            <Package className="w-5 h-5" />
                            {school.products?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/donate?school=${school.id}`} className="flex-1">
                        <Button className="w-full btn-primary">
                          <Store className="mr-2 w-4 h-4" />
                          View Store
                        </Button>
                      </Link>
                      <Link to={`/donate?school=${school.id}`}>
                        <Button variant="outline" size="icon">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Schools;
