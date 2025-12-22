import { Link } from "react-router-dom";
import { Heart, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-coral flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold">
                Flow<span className="text-accent">Aid</span>
              </span>
            </div>
            <p className="text-background/70 text-sm">
              Empowering girls' education by providing essential sanitary supplies to schools in need.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/donate" className="text-background/70 hover:text-background transition-colors">
                  Donate Sanitary Pads
                </Link>
              </li>
              <li>
                <Link to="/schools" className="text-background/70 hover:text-background transition-colors">
                  View Schools
                </Link>
              </li>
              <li>
                <Link to="/other-donations" className="text-background/70 hover:text-background transition-colors">
                  Other Supplies
                </Link>
              </li>
              <li>
                <Link to="/auth?type=school" className="text-background/70 hover:text-background transition-colors">
                  Register Your School
                </Link>
              </li>
            </ul>
          </div>

          {/* For Schools */}
          <div>
            <h4 className="font-bold text-lg mb-4">For Schools</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth?type=school" className="text-background/70 hover:text-background transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/school/dashboard" className="text-background/70 hover:text-background transition-colors">
                  School Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-background/70">
                <Mail className="w-4 h-4" />
                <span>support@flowaid.org</span>
              </li>
              <li className="flex items-center gap-2 text-background/70">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-2 text-background/70">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Making a difference worldwide</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center text-background/60 text-sm">
          <p>© {new Date().getFullYear()} FlowAid. All rights reserved. Empowering education through giving.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;