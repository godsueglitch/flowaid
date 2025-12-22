import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, MapPin, Heart, Loader2, Store, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load schools", variant: "destructive" });
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-24 pb-12 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Schools & Stores</h1>
          <p className="text-xl text-white/90">Support schools directly through their stores</p>
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
                <p className="text-muted-foreground mb-6">Be the first to register your school!</p>
                <Button onClick={() => navigate("/auth?type=school")} className="btn-primary">
                  Register as School
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schools.map((school) => (
                <Card key={school.id} className="card-project">
                  <div className="h-40 gradient-hero flex items-center justify-center relative">
                    <School className="w-16 h-16 text-white/50" />
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
                      {school.description || "Empowering students through education"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {school.location || "Location not specified"}
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
                            ${(school.total_received || 0).toFixed(2)}
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