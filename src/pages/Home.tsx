import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, MapPin, ArrowRight, Users, School, Package, CheckCircle, Star, Store, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { supabase } from "@/integrations/supabase/client";
import kenyaSchool1 from "@/assets/schools/kenya-school-1.jpg";
import kenyaSchool2 from "@/assets/schools/kenya-school-2.jpg";
import kenyaSchool3 from "@/assets/schools/kenya-school-3.jpg";
import kenyaSchool4 from "@/assets/schools/kenya-school-4.jpg";

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
    id: string;
    name: string;
    location: string | null;
    students_count: number | null;
  } | null;
}

interface SchoolData {
  id: string;
  name: string;
  location: string | null;
  students_count: number | null;
  total_received: number | null;
  image_url: string | null;
}

interface Stats {
  totalDonations: number;
  totalSchools: number;
  totalGirls: number;
  totalProducts: number;
}

const schoolImages = [kenyaSchool1, kenyaSchool2, kenyaSchool3, kenyaSchool4];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [urgentProducts, setUrgentProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalDonations: 0, totalSchools: 0, totalGirls: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all sanitary pad products for urgent section
    const { data: urgent } = await supabase
      .from("products")
      .select("*, schools(id, name, location, students_count)")
      .eq("category", "sanitary_pads")
      .order("is_featured", { ascending: false })
      .limit(6);

    // Fetch schools
    const { data: schoolsData } = await supabase
      .from("schools")
      .select("*")
      .order("total_received", { ascending: false })
      .limit(4);

    // Fetch stats
    const { data: allSchools } = await supabase.from("schools").select("students_count");
    const { data: donations } = await supabase.from("donations").select("amount").eq("status", "completed");
    const { data: products } = await supabase.from("products").select("id").eq("category", "sanitary_pads");

    const totalGirls = allSchools?.reduce((acc, s) => acc + (s.students_count || 0), 0) || 0;
    const totalDonations = donations?.reduce((acc, d) => acc + (d.amount || 0), 0) || 0;

    setStats({
      totalDonations,
      totalSchools: allSchools?.length || 0,
      totalGirls,
      totalProducts: products?.length || 0,
    });

    setUrgentProducts(urgent || []);
    setSchools(schoolsData || []);
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (locationQuery) params.set("location", locationQuery);
    window.location.href = `/donate?${params.toString()}`;
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Image Side */}
          <div className="relative hidden lg:block">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${kenyaSchool1})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20" />
            </div>
          </div>

          {/* Content Side */}
          <div className="gradient-hero flex items-center">
            <div className="px-8 lg:px-16 py-20 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                🇰🇪 Proudly Kenyan
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                Empower Kenyan girls.
                <br />
                <span className="text-secondary">Keep them in school.</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Millions of Kenyan girls miss school every month due to lack of sanitary pads. 
                Support a school in your community so every girl has the supplies to succeed.
              </p>
              <Link to="/donate">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 font-bold rounded-full">
                  <Heart className="mr-2 w-5 h-5" />
                  Donate Pads Now
                </Button>
              </Link>
              <p className="text-white/70 text-sm mt-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                100% of donations go directly to Kenyan schools
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-4 -mt-8 relative z-10">
          <div className="search-box p-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center gap-2 px-4">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search schools or supplies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 border-l border-border">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="County (e.g., Nairobi, Kisumu)"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button onClick={handleSearch} className="btn-primary">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 gradient-soft">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">
                {stats.totalGirls.toLocaleString()}+
              </div>
              <p className="text-muted-foreground">Girls Supported</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-accent mb-2">
                {stats.totalSchools}
              </div>
              <p className="text-muted-foreground">Kenyan Schools</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">
                {formatUSD(stats.totalDonations)}
              </div>
              <p className="text-muted-foreground">Total Donated</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-accent mb-2">
                {stats.totalProducts}
              </div>
              <p className="text-muted-foreground">Active Projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schools Section - Linked to Store */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-primary mb-2">Kenyan Schools</h2>
              <p className="text-muted-foreground">Support schools directly through their stores</p>
            </div>
            <div className="flex gap-3">
              <Link to="/register-school">
                <Button variant="outline" className="rounded-full">
                  <Plus className="mr-2 w-4 h-4" />
                  Register School
                </Button>
              </Link>
              <Link to="/schools">
                <Button variant="outline" className="rounded-full">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {schools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {schools.map((school, index) => (
                <Link 
                  key={school.id} 
                  to={`/donate?school=${school.id}`}
                  className="block"
                >
                  <div className="card-project group cursor-pointer">
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={school.image_url || schoolImages[index % schoolImages.length]} 
                        alt={school.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {school.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3" />
                        {school.location || "Kenya"}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          <Users className="w-4 h-4 inline mr-1" />
                          {school.students_count || 0} girls
                        </span>
                        <span className="flex items-center gap-1 text-primary font-semibold">
                          <Store className="w-4 h-4" />
                          View Store
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 gradient-soft rounded-2xl">
              <School className="w-16 h-16 mx-auto text-primary/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">No schools registered yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to register your Kenyan school!
              </p>
              <Link to="/register-school">
                <Button className="btn-primary">
                  Register Your School
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Most Urgent Projects */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-accent mb-4">
              Most Urgent Needs
            </h2>
            <p className="text-muted-foreground uppercase tracking-wide text-sm font-semibold">
              HIGHEST NEED • CLOSEST TO GOAL • HELP NOW
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : urgentProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {urgentProducts.map((product) => (
                <ProjectCard
                  key={product.id}
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
                  schoolId={product.schools?.id}
                  currency="USD"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl shadow-md">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to register a school and create a project!
              </p>
              <Link to="/register-school">
                <Button className="btn-primary">
                  Register Your School
                </Button>
              </Link>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/donate">
              <Button variant="outline" size="lg" className="rounded-full">
                See all projects
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Primary Focus - Sanitary Pads */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 mb-6">
              <Star className="w-4 h-4" />
              <span className="text-sm font-semibold">Our Primary Mission</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Donate Sanitary Pads
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              In Kenya, 65% of women and girls cannot afford sanitary pads. Many girls miss up to 20% of school days. 
              Your donation provides dignity, health, and education to Kenyan girls who need it most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/donate">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 font-bold rounded-full">
                  <Heart className="mr-2 w-5 h-5" />
                  Donate Pads Now
                </Button>
              </Link>
              <Link to="/schools">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10 rounded-full">
                  View Schools & Stores
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-extrabold text-center mb-16 text-primary">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Search,
                title: "Find a School",
                description: "Browse Kenyan schools and their stores for sanitary supplies needed.",
              },
              {
                icon: Heart,
                title: "Make a Donation",
                description: "Choose products from the store. Pay via M-Pesa or Bitcoin.",
              },
              {
                icon: Package,
                title: "Supplies Delivered",
                description: "We ensure supplies reach schools across all 47 counties.",
              },
              {
                icon: Users,
                title: "Track Your Impact",
                description: "See real-time updates on how your donation helps Kenyan girls.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full gradient-coral mx-auto mb-4 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Schools CTA */}
      <section className="py-20 gradient-soft">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold mb-6 text-primary">
                Are you a school in Kenya?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Register your school to create a store and receive donations of sanitary pads and other essential supplies. 
                Join our network of Kenyan schools empowering girls through education.
              </p>
              <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Free registration
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Direct donations
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  M-Pesa support
                </span>
              </div>
              <Link to="/register-school">
                <Button size="lg" className="btn-primary text-lg px-8 py-6">
                  <School className="mr-2 w-5 h-5" />
                  Register Your School
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={kenyaSchool3}
                  alt="Kenyan students in classroom"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
