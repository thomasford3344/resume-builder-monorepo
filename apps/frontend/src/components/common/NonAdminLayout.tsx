import * as React from "react";
import { useAuth } from "./AuthContext";
import { Navigate, Outlet } from "react-router";
import { getProfile, type UserResponse } from "../../services/userService";

const NonAdminLayout: React.FC = () => {
  const { token } = useAuth();
  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (token) {
      getProfile()
        .then((profile) => {
          setUser(profile);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return null; // or a loading spinner
  }

  if (user?.role === "admin") {
    return <Navigate to="/markets" replace />;
  }

  return <Outlet />;
};

export default NonAdminLayout;

