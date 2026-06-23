import { yupResolver } from "@hookform/resolvers/yup";
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link } from "react-router";
import * as yup from "yup";
import { toast } from "react-toastify";
import { register as registerUser } from "../../services/userService";
import { useAuth } from "../../components/common/AuthContext";

const schema = yup
  .object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Valid email is required").required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
  })
  .required();

const Register: React.FC = () => {
  const authContext = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const { formState, register, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<yup.InferType<typeof schema>> = async (
    data,
  ) => {
    try {
      setError(null);
      const { access_token } = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      authContext.login(access_token);
      toast.success("Account created successfully");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to create account";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Paper sx={{ p: 4, width: "100%", maxWidth: 420 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Resume Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your account
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              slotProps={{ input: { ...register("name") } }}
              fullWidth
              size="small"
              error={!!formState.errors.name}
              helperText={formState.errors.name?.message}
            />
            <TextField
              label="Email"
              slotProps={{ input: { ...register("email") } }}
              fullWidth
              size="small"
              error={!!formState.errors.email}
              helperText={formState.errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              slotProps={{ input: { ...register("password") } }}
              fullWidth
              size="small"
              error={!!formState.errors.password}
              helperText={formState.errors.password?.message}
            />
            <TextField
              label="Confirm Password"
              type="password"
              slotProps={{ input: { ...register("confirmPassword") } }}
              fullWidth
              size="small"
              error={!!formState.errors.confirmPassword}
              helperText={formState.errors.confirmPassword?.message}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button variant="contained" type="submit" fullWidth size="large">
              Create account
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" textAlign="center">
          Already have an account?{" "}
          <MuiLink component={Link} to="/login" underline="hover">
            Log in
          </MuiLink>
        </Typography>
      </Stack>
    </Paper>
  );
};

export default Register;
