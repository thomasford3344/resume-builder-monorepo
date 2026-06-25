import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slide,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import {
  createUser,
  updateUser,
  type UserResponse,
  type CreateUserDto,
  type UpdateUserDto,
} from "../../services/userService";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const schema = yup
  .object({
    id: yup.string(),
    email: yup.string().email().required(),
    name: yup.string().required(),
    password: yup.string().when("id", {
      is: (id: string) => !id,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
    role: yup.string().oneOf(["user", "admin"]).required(),
    template: yup
      .string()
      .oneOf(["template1", "template2", "template3", "template4", "template5", "template6"])
      .required(),
    instructions: yup.string().notRequired(),
    questionsPrompt: yup.string().notRequired(),
  })
  .required();

export interface UpsertUserDialogProps {
  open: boolean;
  user?: UserResponse;
  handleClose: () => void;
  callback: (user: UserResponse, mode: "Create" | "Update") => void;
}

export interface UpsertUserDialogRef {
  setUser: (user?: UserResponse) => void;
}

const UpsertUserDialog = React.forwardRef<
  UpsertUserDialogRef,
  UpsertUserDialogProps
>(({ open, handleClose, callback }, ref) => {
  const { formState, control, register, handleSubmit, reset, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id: undefined,
      email: "",
      name: "",
      password: "",
      role: "user" as "user" | "admin",
      template: "template1",
      instructions: "",
      questionsPrompt: "",
    },
  });

  const onSubmit: SubmitHandler<yup.InferType<typeof schema>> = async (
    data
  ) => {
    try {
      if (data.id) {
        const updateData: UpdateUserDto = {
          email: data.email,
          name: data.name,
          role: data.role,
          template: data.template,
          instructions: data.instructions || undefined,
          questionsPrompt: data.questionsPrompt || undefined,
        };
        if (data.password) updateData.password = data.password;
        const res = await updateUser(data.id, updateData);
        callback(res, "Update");
      } else {
        const createData: CreateUserDto = {
          email: data.email,
          name: data.name,
          password: data.password!,
          role: data.role,
          template: data.template,
          instructions: data.instructions || undefined,
          questionsPrompt: data.questionsPrompt || undefined,
        };
        const res = await createUser(createData);
        callback(res, "Create");
      }
      handleClose();
    } catch {
      toast.error(`Failed to ${data.id ? "update" : "create"} user`);
    }
  };

  React.useImperativeHandle(ref, () => ({
    setUser: (user) => {
      if (user) {
        reset({
          id: user._id,
          email: user.email,
          name: user.name,
          password: "",
          role: user.role,
          template: user.template || "template1",
          instructions: user.instructions || "",
          questionsPrompt: user.questionsPrompt || "",
        });
      } else {
        reset({
          id: "",
          email: "",
          name: "",
          password: "",
          role: "user",
          template: "template1",
          instructions: "",
          questionsPrompt: "",
        });
      }
    },
  }));

  const userId = watch("id");
  const isEditMode = !!userId;

  return (
    <Dialog
      open={open}
      slots={{
        transition: Transition,
      }}
      keepMounted
      maxWidth="sm"
      fullWidth
      scroll="body"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEditMode ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent dividers>
          <input type="hidden" {...register("id")} />
          <Grid container spacing={2} py={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email"
                type="email"
                slotProps={{ input: { ...register("email") } }}
                fullWidth
                size="small"
                error={formState.errors.email ? true : false}
                helperText={formState.errors.email?.message}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Name"
                slotProps={{ input: { ...register("name") } }}
                fullWidth
                size="small"
                error={formState.errors.name ? true : false}
                helperText={formState.errors.name?.message}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Password"
                type="password"
                slotProps={{ input: { ...register("password") } }}
                fullWidth
                size="small"
                error={formState.errors.password ? true : false}
                helperText={
                  formState.errors.password?.message ||
                  (isEditMode ? "Leave blank to keep current password" : "")
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="role-select-label">Role</InputLabel>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Role" labelId="role-select-label">
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="template-select-label">Template</InputLabel>
                <Controller
                  name="template"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Template"
                      labelId="template-select-label"
                    >
                      <MenuItem value="template1">Template 1</MenuItem>
                      <MenuItem value="template2">Template 2</MenuItem>
                      <MenuItem value="template3">Template 3</MenuItem>
                      <MenuItem value="template4">Template 4</MenuItem>
                      <MenuItem value="template5">Template 5</MenuItem>
                      <MenuItem value="template6">Template 6</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Instructions"
                slotProps={{
                  input: { ...register("instructions") },
                }}
                multiline
                rows={6}
                fullWidth
                size="small"
                placeholder="Enter custom instructions for resume generation (optional)"
                helperText="These instructions will be appended to the default resume generation prompt for this user"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Questions Prompt"
                slotProps={{
                  input: { ...register("questionsPrompt") },
                }}
                multiline
                rows={8}
                fullWidth
                size="small"
                placeholder="Enter custom prompt for answering job application questions (optional)"
                helperText="This prompt will override the default questions answering prompt for this user"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">{isEditMode ? "Update" : "Create"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
});

export default UpsertUserDialog;
