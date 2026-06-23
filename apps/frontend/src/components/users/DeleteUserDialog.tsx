import * as React from "react";
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Slide,
} from "@mui/material";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";
import type { TransitionProps } from "@mui/material/transitions";
import { toast } from "react-toastify";
import { deleteUser } from "../../services/userService";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface DeleteUserDialogProps {
  callback: (id: string) => void;
}

export interface DeleteUserDialogRef {
  setUserId: (id: string) => void;
}

const DeleteUserDialog = React.forwardRef<
  DeleteUserDialogRef,
  DeleteUserDialogProps
>(({ callback }, ref) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [open, setOpen] = React.useState<boolean>(false);
  const [id, setId] = React.useState<string>("");
  React.useImperativeHandle(ref, () => ({
    setUserId: (userId) => {
      setId(userId);
      setOpen(true);
    },
  }));
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
      <DialogTitle>Are you sure to remove this user?</DialogTitle>
      <DialogActions sx={{ justifyContent: "space-between" }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <IconButton
            color="info"
            onClick={async () => {
              try {
                setLoading(true);
                await deleteUser(id);
                callback(id);
                setOpen(false);
              } catch {
                toast.error("Failed to delete user");
              } finally {
                setLoading(false);
              }
            }}
          >
            <CheckIcon />
          </IconButton>
        )}

        <IconButton
          color="error"
          onClick={() => {
            setOpen(false);
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogActions>
    </Dialog>
  );
});

export default DeleteUserDialog;
