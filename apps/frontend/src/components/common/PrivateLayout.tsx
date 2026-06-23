import * as React from "react";
import { useAuth } from "./AuthContext";
import { Navigate, Outlet } from "react-router";

const PrivateLayout: React.FC = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateLayout;
