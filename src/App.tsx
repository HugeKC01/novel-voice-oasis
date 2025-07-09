
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/AuthForm";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TextToSpeechPage from "./pages/TextToSpeechPage";
import Collections from "./pages/Collections";
import CollectionView from "./pages/CollectionView";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/landing" 
        element={!user ? <Landing /> : <Navigate to="/dashboard" replace />}
      />
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <AuthForm />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/text-to-speech" 
        element={
          <ProtectedRoute>
            <TextToSpeechPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/collections" 
        element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/collection/:id" 
        element={
          <ProtectedRoute>
            <CollectionView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
