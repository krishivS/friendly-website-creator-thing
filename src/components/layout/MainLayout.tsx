
import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/toaster';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Debug authentication state
  useEffect(() => {
    console.log('MainLayout auth state:', { isAuthenticated, isLoading, currentUser });
  }, [isAuthenticated, isLoading, currentUser]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cms-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('User not authenticated in MainLayout, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default MainLayout;
