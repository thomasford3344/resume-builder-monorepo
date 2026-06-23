import * as React from "react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Toolbar,
  Typography,
} from "@mui/material";
import Select from "react-select";
import moment from "moment";
import { Autorenew as AutorenewIcon } from "@mui/icons-material";
import { keyframes } from "@emotion/react";
import { styled } from "@mui/material/styles";

import { useRace } from "./RaceContext";
import { useAuth } from "./AuthContext";
import retroImg from "../../assets/RetroLogo.png";

// Define rotation animation
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface RotatingIconProps {
  loading?: boolean;
}

// Styled Icon that rotates when loading
const RotatingIcon = styled(AutorenewIcon, {
  shouldForwardProp: (prop) => prop !== "loading",
})<RotatingIconProps>(({ loading }) => ({
  animation: loading ? `${rotate} 1s linear infinite` : "none",
}));

const Layout: React.FC = () => {
  const {
    // markets,
    accountFunds,
    loading,
    loadMarkets,
    loadAccountFunds,
    setRefresh,
  } = useRace();
  const { logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const { marketId } = useParams<{ marketId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  // const options = React.useMemo(
  //   () =>
  //     markets.map((market) => ({
  //       value: market.id,
  //       label: `${market.eventVenue}
  //               ${moment(market.startTime).format("HH:mm")}
  //               ${market.numberOfActiveRunners}/${market.numberOfRunners}`,
  //     })),
  //   [markets],
  // );

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar
        position="static"
        sx={{
          flexBasis: "128px",
          maxHeight: "128px",
          background:
            "radial-gradient(circle at bottom left, #fb8300 0%, #fb7300 50%, #040100 100%)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "center",
            background: `url(${retroImg}) left center / auto 100% no-repeat`,
          }}
        >
          <Link href="https://autom8.racingdata.net" color="#040100">
            AutoM8
          </Link>
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            sx={{ mx: 3, bgcolor: "#040100", width: 2 }}
          />
          <Link href="https://bvol.racingdata.net" color="#040100">
            Bvol
          </Link>
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            sx={{ mx: 3, bgcolor: "#040100", width: 2 }}
          />
          <Link href="https://racingdata.net" color="#040100">
            Data
          </Link>
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            sx={{ mx: 3, bgcolor: "#040100", width: 2 }}
          />
          <Link href="https://beep.racingdata.net" color="#040100">
            BEEP
          </Link>
        </Toolbar>
        <Toolbar>
          <Button component={RouterLink} to="/systems" variant="contained">
            Systems
          </Button>
          <Button
            component={RouterLink}
            to="/markets"
            variant="contained"
            sx={{ ml: 1 }}
          >
            Markets
          </Button>
          <Box sx={{ width: 300, ml: 1 }}>
            {/* <Select
              options={options}
              value={options.filter((option) => option.value === marketId)}
              onChange={(option) => {
                if (option) navigate(`/markets/${option.value}`);
              }}
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: "#545454",
                }),
                singleValue: (baseStyles) => ({
                  ...baseStyles,
                  color: "#ffffff",
                }),
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  color: state.isFocused ? "#000000" : "#ffffff",
                  backgroundColor: state.isFocused ? undefined : "#545454",
                }),
              }}
            /> */}
          </Box>
          <Button
            variant="contained"
            sx={{ ml: 1 }}
            onClick={() => setLogoutDialogOpen(true)}
          >
            Logout
          </Button>
          <Box
            sx={{
              bgcolor: (theme) => theme.palette.primary.main,
              py: 0.5,
              px: 1,
              ml: "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconButton
              color="inherit"
              disabled={loading}
              onClick={() => {
                if (location.pathname === "/markets") loadMarkets();
                else if (/^\/markets\/([\d.]+)$/.test(location.pathname))
                  setRefresh();
                loadAccountFunds(true);
              }}
            >
              <RotatingIcon loading={loading} />
            </IconButton>
            {accountFunds !== undefined && (
              <>
                <Typography sx={{ ml: 1 }}>
                  Balance: £{accountFunds.availableToBetBalance}
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  Exposure: £{accountFunds.exposure}
                </Typography>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              logout();
              setLogoutDialogOpen(false);
            }}
            color="primary"
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
      <Box
        sx={{
          bgcolor: "#e0e0e0",
          padding: 2,
          overflow: "auto",
          flexBasis: "calc(100vh - 128px)",
          maxHeight: "calc(100vh - 128px)",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
