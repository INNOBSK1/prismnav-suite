import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, registrationLoading, canAccess } = useAuth();

  if (loading || registrationLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
