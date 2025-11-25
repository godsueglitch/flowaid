import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, TrendingUp, School, Store, Wallet, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DonorDashboard = () => {
  const [totalDonated] = useState(2450);
  const [schoolsSupported] = useState(8);
  const [impactScore] = useState(95);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back, Donor! 💖</h1>
          <p className="text-muted-foreground text-lg">Your generosity is changing lives</p>
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
              <p className="text-4xl font-bold">${totalDonated}</p>
              <p className="text-sm text-muted-foreground mt-1">+$350 this month</p>
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
              <p className="text-sm text-muted-foreground mt-1">Across 5 countries</p>
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
              <p className="text-4xl font-bold">{impactScore}%</p>
              <p className="text-sm text-muted-foreground mt-1">Top 10% of donors</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Impact */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Your Recent Impact</CardTitle>
              <CardDescription>See how your donations are making a difference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { school: "Sunshine Elementary", amount: "$250", impact: "Purchased 50 books" },
                { school: "Hope High School", amount: "$150", impact: "Funded 3 scholarships" },
                { school: "Future Academy", amount: "$200", impact: "New computer lab" }
              ].map((donation, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{donation.school}</p>
                    <p className="text-sm text-muted-foreground">{donation.impact}</p>
                  </div>
                  <p className="font-bold text-primary">{donation.amount}</p>
                </div>
              ))}
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
                    View Other Donations
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
            <CardTitle>Schools You Might Like to Support</CardTitle>
            <CardDescription>Discover schools making incredible impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Ocean View School", students: 450, need: "$2,300" },
                { name: "Mountain Peak Academy", students: 320, need: "$1,850" },
                { name: "Valley Elementary", students: 280, need: "$1,500" }
              ].map((school, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center mb-3">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold mb-1">{school.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{school.students} students</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Needs: {school.need}</span>
                    <Link to="/donate">
                      <Button size="sm" className="btn-glow">
                        Donate
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonorDashboard;
