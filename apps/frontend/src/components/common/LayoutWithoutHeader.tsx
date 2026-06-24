import { Box } from "@mui/material";
import * as React from "react";
import { Outlet } from "react-router";

const LayoutWithoutHeader: React.FC = () => {
  return (
    <Box
      sx={{
        bgcolor: (theme) => theme.palette.background.default,
        color: (theme) => theme.palette.text.primary,
        padding: 2,
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Outlet />
    </Box>
  );
};

export default LayoutWithoutHeader;
