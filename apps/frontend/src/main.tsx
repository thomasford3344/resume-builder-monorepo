import * as React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import Systems from "./pages/systems";
import Layout from "./components/common/Layout";
import AuthProvider from "./components/common/AuthContext";
import ThemeModeProvider, { useThemeMode } from "./components/common/ThemeContext";
import AdminLayout from "./components/common/AdminLayout";
import NonPrivateLayout from "./components/common/NonPrivateLayout";
import Login from "./pages/login";
import Register from "./pages/register";
// import Markets from "./pages/markets";
import RaceProvider from "./components/common/RaceContext";
// import MarketDetail from "./pages/markets/MarketDetail";
import Users from "./pages/users";
import Resumes from "./pages/resumes";
import CreateResume from "./pages/resumes/CreateResume";
import FromJson from "./pages/resumes/FromJson";
import LayoutWithoutHeader from "./components/common/LayoutWithoutHeader";
import NonAdminLayout from "./components/common/NonAdminLayout";
import Profile from "./pages/profile";

const router = createBrowserRouter([
  // 🔒 Admin routes
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/resumes" replace /> },
          // { path: "markets", element: <Markets /> }, // '/markets'
          // { path: "markets/:marketId", element: <MarketDetail /> }, // '/markets/:marketId'
          // { path: "systems", element: <Systems /> }, // '/systems'
        ],
      },
      {
        element: <LayoutWithoutHeader />,
        children: [
          { path: "users", element: <Users /> }, // '/users'
        ],
      },
    ],
  },

  // 🔒 Private routes
  {
    path: "/", // base route for authenticated section
    element: <NonAdminLayout />,
    children: [
      {
        element: <LayoutWithoutHeader />,
        children: [
          { path: "resumes", element: <Resumes /> }, // '/resumes'
          { path: "resumes/new", element: <CreateResume /> }, // '/resumes/new'
          { path: "fromjson", element: <FromJson /> }, // '/fromjson'
          { path: "profile", element: <Profile /> }, // '/profile'
        ],
      },
    ],
  },

  // 🔓 Public (non-auth) routes
  {
    path: "/", // can stay the same, but use nested path for login
    element: <NonPrivateLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/resumes" replace /> },
]);

const AppContent: React.FC = () => {
  const { mode } = useThemeMode();

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={mode}
      />
    </>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RaceProvider>
        <ThemeModeProvider>
          <AppContent />
        </ThemeModeProvider>
      </RaceProvider>
    </AuthProvider>
  </StrictMode>
);
