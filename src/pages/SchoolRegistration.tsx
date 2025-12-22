import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { School, MapPin, Users, Phone, Mail, Building, ArrowLeft, Heart, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SchoolRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    location: "",
    county: "",
    studentsCount: "",
    girlsCount: "",
    contactName: "",
    phone: "",
    email: "",
    description: "",
    walletAddress: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create a user account for the school
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12), // Temporary password
        options: {
          data: {
            full_name: formData.contactName,
            role: 'school'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create school record
        const { error: schoolError } = await supabase
          .from("schools")
          .insert({
            profile_id: authData.user.id,
            name: formData.schoolName,
            location: `${formData.location}, ${formData.county}, Kenya`,
            students_count: parseInt(formData.studentsCount) || 0,
            description: formData.description,
            wallet_address: formData.walletAddress || null,
          });

        if (schoolError) throw schoolError;

        setSubmitted(true);
        toast({
          title: "Registration Successful! 🎉",
          description: "Your school has been registered. Check your email for login details.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="py-12">
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Asante Sana! 🙏</h2>
              <p className="text-muted-foreground mb-6">
                Your school registration has been submitted successfully. 
                Our team will review your application and contact you within 48 hours.
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate("/")} className="w-full bg-primary hover:bg-primary/90">
                  <Heart className="mr-2 w-4 h-4" />
                  Return Home
                </Button>
                <Button variant="outline" onClick={() => navigate("/schools")} className="w-full">
                  View Partner Schools
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/schools")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Schools
          </Button>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <School className="w-4 h-4" />
              School Registration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Register Your School
            </h1>
            <p className="text-lg text-muted-foreground">
              Join FlowAid Kenya and help your girl students access free sanitary products. 
              Registration is free and takes less than 5 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                School Information
              </CardTitle>
              <CardDescription>
                Please provide accurate information about your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* School Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      name="schoolName"
                      placeholder="e.g., Moi Girls High School"
                      value={formData.schoolName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County *</Label>
                    <Input
                      id="county"
                      name="county"
                      placeholder="e.g., Nairobi"
                      value={formData.county}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Physical Address *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., Kilimani, Nairobi"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentsCount" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total Students *
                    </Label>
                    <Input
                      id="studentsCount"
                      name="studentsCount"
                      type="number"
                      placeholder="e.g., 500"
                      value={formData.studentsCount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="girlsCount">Number of Girls *</Label>
                    <Input
                      id="girlsCount"
                      name="girlsCount"
                      type="number"
                      placeholder="e.g., 250"
                      value={formData.girlsCount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Contact Person</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Full Name *</Label>
                      <Input
                        id="contactName"
                        name="contactName"
                        placeholder="e.g., Jane Wanjiku"
                        value={formData.contactName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="0734319033"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="principal@school.ac.ke"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">About Your School</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your school and why you need support..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                {/* Wallet (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Bitcoin Wallet Address (Optional)</Label>
                  <Input
                    id="walletAddress"
                    name="walletAddress"
                    placeholder="For direct donations"
                    value={formData.walletAddress}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    If you have a Bitcoin wallet, donations can be sent directly to you
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <School className="mr-2 w-4 h-4" />
                      Register School
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SchoolRegistration;
