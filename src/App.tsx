import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MarketPrice from "./pages/MarketPrice.tsx";
import AIPrediction from "./pages/AIPrediction.tsx";
import SalesChannel from "./pages/SalesChannel.tsx";
import CropRecommend from "./pages/CropRecommend.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/market" element={<MarketPrice />} />
          <Route path="/prediction" element={<AIPrediction />} />
          <Route path="/prediction/expanded" element={<AIPrediction defaultExpanded />} />
          <Route path="/sales" element={<SalesChannel />} />
          <Route path="/crop" element={<CropRecommend />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
