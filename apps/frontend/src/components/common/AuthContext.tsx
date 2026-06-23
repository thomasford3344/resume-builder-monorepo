import React, { createContext, useContext, useState, useEffect } from "react";
import ApiClient from "../../services/apiClient";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token") ?? null
  );

  // Save token to localStorage when login
  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("access_token", newToken);
  };

  // Remove token when logout
  const logout = () => {
    setToken(null);
    localStorage.removeItem("access_token");
  };

  useEffect(() => {
    ApiClient.registerLogoutHandler(logout);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)!;
export default AuthProvider;
