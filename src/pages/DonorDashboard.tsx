import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, TrendingUp, School, Store, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Donation {
  id: string;
  amount: number;
  created_at: string;
  purpose: string | null;
  school_id: string | null;
  product_id: string | null;
  schools?: { name: string } | null;
  products?: { name: string } | null;
}

interface SchoolData {
  id: string;
  name: string;
  students_count: number | null;
  total_received: number | null;
}

const DonorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [schoolsSupported, setSchoolsSupported] = useState(0);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      // Get user's donations with school and product names
      const { data: donationsData } = await supabase
        .from("donations")
        .select(`
          id,
          amount,
          created_at,
          purpose,
          school_id,
          product_id,
          schools(name),
          products(name)
        `)
        .eq("donor_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (donationsData) {
        setDonations(donationsData as Donation[]);
        
        // Calculate totals
        const total = donationsData.reduce((sum, d) => sum + Number(d.amount), 0);
        setTotalDonated(total);
        
        // Count unique schools
        const uniqueSchools = new Set(donationsData.map(d => d.school_id).filter(Boolean));
        setSchoolsSupported(uniqueSchools.size);
      }

      // Get schools to suggest
      const { data: schoolsData } = await supabase
        .from("schools")
        .select("id, name, students_count, total_received")
        .limit(3);

      if (schoolsData) {
        setSchools(schoolsData);
      }

      setLoading(false);
    };

    checkAuthAndLoadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasDonations = donations.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 p-4 md:pt-24 md:p-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome{userName ? `, ${userName}` : " Back"}! 💖
            </h1>
            <p className="text-muted-foreground text-lg">
              {hasDonations ? "Your generosity is changing lives" : "Start your journey of making a difference"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="card-soft border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Heart className="w-5 h-5" />
                  Total Donated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">${totalDonated.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasDonations ? "Thank you for your support" : "Make your first donation today"}
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <School className="w-5 h-5" />
                  Schools Supported
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{schoolsSupported}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {schoolsSupported > 0 ? "Impacting communities" : "Support your first school"}
                </p>
              </CardContent>
            </Card>

            <Card className="card-soft border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-5 h-5" />
                  Impact Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {hasDonations ? Math.min(100, Math.round(totalDonated / 25)) : 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasDonations ? "Building your impact" : "Start contributing"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Impact */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Your Recent Donations</CardTitle>
                <CardDescription>
                  {hasDonations ? "See how your donations are making a difference" : "Your donations will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasDonations ? (
                  donations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {donation.schools?.name || donation.products?.name || "General Donation"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {donation.purpose || "Supporting education"}
                        </p>
                      </div>
                      <p className="font-bold text-primary">${Number(donation.amount).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No donations yet</p>
                    <p className="text-sm">Make your first donation to see your impact here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-soft gradient-mixed text-white">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription className="text-white/80">What would you like to do today?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/donate">
                  <Button variant="secondary" className="w-full justify-between btn-glow" size="lg">
                    <span className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Make a Donation
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/schools">
                  <Button variant="secondary" className="w-full justify-between" size="lg">
                    <span className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Browse Schools
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/other-donations">
                  <Button variant="secondary" className="w-full justify-between" size="lg">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Other Donations
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Featured Schools */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Schools You Can Support</CardTitle>
              <CardDescription>Discover schools making incredible impact</CardDescription>
            </CardHeader>
            <CardContent>
              {schools.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {schools.map((school) => (
                    <div key={school.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center mb-3">
                        <School className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold mb-1">{school.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {school.students_count || 0} students
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Received: ${(school.total_received || 0).toLocaleString()}
                        </span>
                        <Link to="/donate">
                          <Button size="sm" className="btn-glow">
                            Donate
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <School className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No schools registered yet</p>
                  <p className="text-sm">Check back soon for schools to support</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DonorDashboard;