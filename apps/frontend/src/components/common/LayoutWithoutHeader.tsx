import { Box } from "@mui/material";
import * as React from "react";
import { Outlet } from "react-router";

const LayoutWithoutHeader: React.FC = () => {
  return (
    <Box
      sx={{
        bgcolor: "#e0e0e0",
        padding: 2,
        minHeight: "100vh",
      }}
    >
      <Outlet />
    </Box>
  );
};

export default LayoutWithoutHeader;
