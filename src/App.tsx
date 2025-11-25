import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import DonorDashboard from "./pages/DonorDashboard";
import SchoolDashboard from "./pages/SchoolDashboard";
import NotFound from "./pages/NotFound";
import Donate from "./pages/Donate";
import OtherDonations from "./pages/OtherDonations";
import Schools from "./pages/Schools";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/school/dashboard" element={<SchoolDashboard />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/other-donations" element={<OtherDonations />} />
          <Route path="/schools" element={<Schools />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
