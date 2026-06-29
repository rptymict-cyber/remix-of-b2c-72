import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MarketPrice from "./pages/MarketPrice.tsx";
import AIPrediction from "./pages/AIPrediction.tsx";
import SalesChannel from "./pages/SalesChannel.tsx";
import CropRecommend from "./pages/CropRecommend.tsx";
import Watchlist from "./pages/Watchlist.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Notifications from "./pages/Notifications.tsx";
import NotificationSettings from "./pages/NotificationSettings.tsx";
import MyPage from "./pages/MyPage.tsx";
import AddCrop from "./pages/AddCrop.tsx";
import FarmEdit from "./pages/FarmEdit.tsx";
import CropSettings from "./pages/CropSettings.tsx";
import SearchPage from "./pages/Search.tsx";
import InterestCropDetail from "./pages/InterestCropDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useApp } from "./store/appStore";

const queryClient = new QueryClient();

const Gate = ({ children }: { children: JSX.Element }) => {
  const onboarded = useApp((s) => s.profile.onboarded);
  const loc = useLocation();
  if (!onboarded && loc.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <div className="mx-auto max-w-[430px] h-[100dvh] bg-background shadow-sm relative overflow-hidden">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Gate><Index /></Gate>} />
          <Route path="/market" element={<Gate><MarketPrice /></Gate>} />
          <Route path="/prediction" element={<Gate><AIPrediction /></Gate>} />
          <Route path="/prediction/expanded" element={<Gate><AIPrediction defaultExpanded /></Gate>} />
          <Route path="/sales" element={<Gate><SalesChannel /></Gate>} />
          <Route path="/crop" element={<Gate><CropRecommend /></Gate>} />
          <Route path="/watchlist" element={<Gate><Watchlist /></Gate>} />
          <Route path="/crop/add" element={<Gate><AddCrop /></Gate>} />
          <Route path="/farm-edit" element={<Gate><FarmEdit /></Gate>} />
          <Route path="/crop-settings/:id" element={<Gate><CropSettings /></Gate>} />
          <Route path="/notifications" element={<Gate><Notifications /></Gate>} />
          <Route path="/notification-settings" element={<Gate><NotificationSettings /></Gate>} />
          <Route path="/mypage" element={<Gate><MyPage /></Gate>} />
          <Route path="/search" element={<Gate><SearchPage /></Gate>} />
          <Route path="/interest/:id" element={<Gate><InterestCropDetail /></Gate>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
