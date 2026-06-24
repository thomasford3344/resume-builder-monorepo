import * as React from "react";
import { Navigate, Outlet } from "react-router";
import { Box } from "@mui/material";

import { useAuth } from "./AuthContext";

const NonPrivateLayout: React.FC = () => {
  const { token } = useAuth();
  return token ? (
    <Navigate to="/resumes" replace />
  ) : (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: (theme) => theme.palette.background.default,
        color: (theme) => theme.palette.text.primary,
        p: 2,
      }}
    >
      <Outlet />
    </Box>
  );
};

export default NonPrivateLayout;
