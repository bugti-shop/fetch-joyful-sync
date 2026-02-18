import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { WelcomeProvider } from "@/contexts/WelcomeContext";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import Progress from "./pages/Progress";
import Pro from "./pages/Pro";
import Settings from "./pages/Settings";
import Folders from "./pages/Folders";
import FolderDetail from "./pages/FolderDetail";
import Tools from "./pages/Tools";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/pro" element={<Pro />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/folder/:folderId" element={<FolderDetail />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/profile" element={<Profile />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SubscriptionProvider>
      <GoogleAuthProvider>
        <WelcomeProvider>
          <ExpenseProvider>
            <FamilyProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </FamilyProvider>
          </ExpenseProvider>
        </WelcomeProvider>
      </GoogleAuthProvider>
    </SubscriptionProvider>
  </QueryClientProvider>
);

export default App;
