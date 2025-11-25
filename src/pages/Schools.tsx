import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, MapPin, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface School {
  id: string;
  name: string;
  description: string;
  location: string;
  students_count: number;
  total_received: number;
  image_url: string | null;
}

const Schools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load schools",
        variant: "destructive",
      });
    } else {
      setSchools(data || []);
    }
    setLoading(false);
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
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Schools 🏫</h1>
          <p className="text-muted-foreground text-lg">
            Discover schools making an incredible impact
          </p>
        </div>

        {schools.length === 0 ? (
          <Card className="card-soft text-center py-12">
            <CardContent>
              <School className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No schools yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to register your school!
              </p>
              <Button onClick={() => navigate("/auth")} className="btn-glow">
                Register as School
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {schools.map((school) => (
              <Card key={school.id} className="card-soft hover:shadow-lg transition-shadow">
                <div className="gradient-blue h-32 flex items-center justify-center">
                  <School className="w-16 h-16 text-white" />
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
                      {school.students_count} students
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Received
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ${school.total_received.toFixed(2)}
                    </div>
                  </div>
                  <Button className="w-full btn-glow" onClick={() => navigate("/donate")}>
                    <Heart className="mr-2 w-4 h-4" />
                    Support This School
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

export default Schools;
