import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, DollarSign, Users, TrendingUp, Package, Heart } from "lucide-react";

const SchoolDashboard = () => {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">School Dashboard 🏫</h1>
          <p className="text-muted-foreground text-lg">Manage your profile and connect with donors</p>
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
              <p className="text-3xl font-bold">$8,450</p>
            </CardContent>
          </Card>

          <Card className="card-soft border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-accent">
                <Heart className="w-4 h-4" />
                Active Donors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">127</p>
            </CardContent>
          </Card>

          <Card className="card-soft border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-primary">
                <Store className="w-4 h-4" />
                Store Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$3,200</p>
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
              <p className="text-3xl font-bold">450</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Recent Donations */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Latest contributions from donors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { donor: "Anonymous", amount: "$500", purpose: "General Fund", time: "2 hours ago" },
                { donor: "Sarah J.", amount: "$250", purpose: "Library Books", time: "5 hours ago" },
                { donor: "Michael R.", amount: "$750", purpose: "Computer Lab", time: "1 day ago" }
              ].map((donation, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{donation.donor}</p>
                    <p className="text-sm text-muted-foreground">{donation.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{donation.amount}</p>
                    <p className="text-xs text-muted-foreground">{donation.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Store Management */}
          <Card className="card-soft gradient-mixed text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Store className="w-6 h-6" />
                School Store
              </CardTitle>
              <CardDescription className="text-white/80">Manage your products and sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                  <p className="text-sm text-white/80 mb-1">Active Products</p>
                  <p className="text-2xl font-bold text-white">24</p>
                </div>
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur">
                  <p className="text-sm text-white/80 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-white">158</p>
                </div>
              </div>
              <Button variant="secondary" className="w-full" size="lg">
                <Package className="mr-2 w-5 h-5" />
                Manage Store
              </Button>
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
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { category: "Educational Materials", amount: "$3,500", percentage: 41 },
                { category: "Technology & Equipment", amount: "$2,800", percentage: 33 },
                { category: "Student Support", amount: "$2,150", percentage: 26 }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{item.category}</h4>
                    <span className="text-sm font-bold text-primary">{item.percentage}%</span>
                  </div>
                  <p className="text-2xl font-bold mb-2">{item.amount}</p>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-pink rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
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

export default SchoolDashboard;
