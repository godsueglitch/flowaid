import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, DollarSign, Users, TrendingUp, Package, Heart, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Donation {
  id: string;
  amount: number;
  created_at: string;
  purpose: string | null;
  profiles?: { full_name: string | null } | null;
  products?: { name: string } | null;
}

interface SchoolData {
  id: string;
  name: string;
  students_count: number | null;
  total_received: number | null;
  status: string;
}

const SchoolDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [donorsCount, setDonorsCount] = useState(0);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth?type=school");
        return;
      }

      // Get school data for this user
      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, name, students_count, total_received, status")
        .eq("profile_id", session.user.id)
        .single();

      if (!schoolData) {
        // User is not a school, redirect to registration
        navigate("/auth?type=school");
        return;
      }

      setSchool(schoolData);

      // Get donations to this school
      const { data: donationsData } = await supabase
        .from("donations")
        .select(`
          id,
          amount,
          created_at,
          purpose,
          profiles(full_name),
          products(name)
        `)
        .eq("school_id", schoolData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (donationsData) {
        setDonations(donationsData as Donation[]);
        
        // Count unique donors
        const uniqueDonors = new Set(donationsData.map(d => d.profiles?.full_name).filter(Boolean));
        setDonorsCount(uniqueDonors.size);
      }

      // Get products count
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolData.id);

      setProductsCount(count || 0);

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

  if (!school) {
    return null;
  }

  const hasDonations = donations.length > 0;
  const totalReceived = school.total_received || 0;

  // Calculate impact breakdown from donations
  const impactData = donations.reduce((acc, d) => {
    const category = d.products?.name || d.purpose || "General Support";
    const amount = Number(d.amount);
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += amount;
    return acc;
  }, {} as Record<string, number>);

  const impactItems = Object.entries(impactData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalReceived > 0 ? Math.round((amount / totalReceived) * 100) : 0
    }));

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 p-4 md:pt-24 md:p-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{school.name} Dashboard 🏫</h1>
            <p className="text-muted-foreground text-lg">Manage your profile and connect with donors</p>
            {school.status === "pending" && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                <p className="font-semibold">⏳ Pending Approval</p>
                <p className="text-sm">Your school registration is under review. You'll be able to receive donations once approved by our admin team.</p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="card-soft border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-primary">
                  <DollarSign className="w-4 h-4" />
                  Total Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${totalReceived.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="card-soft border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-accent">
                  <Heart className="w-4 h-4" />
                  Donors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{donorsCount}</p>
              </CardContent>
            </Card>

            <Card className="card-soft border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-primary">
                  <Store className="w-4 h-4" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{productsCount}</p>
              </CardContent>
            </Card>

            <Card className="card-soft border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-accent">
                  <Users className="w-4 h-4" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{school.students_count || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Recent Donations */}
            <Card className="card-soft">
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>
                  {hasDonations ? "Latest contributions from donors" : "Donations will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasDonations ? (
                  donations.map((donation) => (
                    <div key={donation.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {donation.profiles?.full_name || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {donation.products?.name || donation.purpose || "General support"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${Number(donation.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(donation.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No donations yet</p>
                    <p className="text-sm">Share your school page to start receiving donations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Store Management */}
            <Card className="card-soft gradient-mixed text-white">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="w-6 h-6" />
                  School Store
                </CardTitle>
                <CardDescription className="text-white/80">Manage your products and needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                    <p className="text-sm text-white/80 mb-1">Active Products</p>
                    <p className="text-2xl font-bold text-white">{productsCount}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                    <p className="text-sm text-white/80 mb-1">Total Donations</p>
                    <p className="text-2xl font-bold text-white">{donations.length}</p>
                  </div>
                </div>
                <Link to="/other-donations">
                  <Button variant="secondary" className="w-full" size="lg">
                    <Package className="mr-2 w-5 h-5" />
                    View Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Impact Report */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Impact Overview
              </CardTitle>
              <CardDescription>How donations are being used</CardDescription>
            </CardHeader>
            <CardContent>
              {impactItems.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {impactItems.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{item.category}</h4>
                        <span className="text-sm font-bold text-primary">{item.percentage}%</span>
                      </div>
                      <p className="text-2xl font-bold mb-2">${item.amount.toLocaleString()}</p>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-pink rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No impact data yet</p>
                  <p className="text-sm">Once you receive donations, impact breakdown will appear here</p>
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

export default SchoolDashboard;