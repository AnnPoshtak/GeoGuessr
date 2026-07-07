import { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/context/UserContext.tsx";

interface ProtectedRouteProps {
  children?: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useUser();
  if (user === undefined) return <div>Loading...</div>;
  if (user === null) return <Navigate to="/auth" replace />;

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
