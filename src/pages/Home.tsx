import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, School, Store, Wallet, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 md:py-32">
        <div className="absolute inset-0 gradient-mixed opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Empowering Education Through Giving</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              FlowAid
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Connect your wallet, make a difference. Support schools and watch your impact grow in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?type=donor">
                <Button size="lg" className="btn-glow group">
                  Donate Now
                  <Heart className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth?type=school">
                <Button size="lg" variant="outline" className="group">
                  Register School
                  <School className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Wallet,
                title: "Connect Wallet",
                description: "Link your crypto wallet securely during registration or donation",
                color: "text-primary"
              },
              {
                icon: Heart,
                title: "Choose a School",
                description: "Browse schools in need and select where you want to make an impact",
                color: "text-accent"
              },
              {
                icon: Store,
                title: "Shop or Donate",
                description: "Purchase from school stores or make direct donations",
                color: "text-primary"
              },
              {
                icon: TrendingUp,
                title: "Track Impact",
                description: "Watch real-time updates on how your contribution helps",
                color: "text-accent"
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="card-soft p-6 hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl gradient-pink flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="card-soft p-12 gradient-mixed text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">Ready to Make a Difference?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Join thousands of donors supporting schools worldwide. Every contribution counts.
            </p>
            <Link to="/auth?type=donor">
              <Button size="lg" variant="secondary" className="btn-glow group">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
