import * as React from "react";
import {
  Button,
  Stack,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Popover,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { toast } from "react-toastify";

import UpsertUserDialog, {
  type UpsertUserDialogRef,
} from "../../components/users/UpsertUserDialog";
import { getUsers, type UserResponse } from "../../services/userService";
import DeleteUserDialog, {
  type DeleteUserDialogRef,
} from "../../components/users/DeleteUserDialog";

const Users: React.FC = () => {
  const [upsertDlgOpen, setUpsertDlgOpen] = React.useState<boolean>(false);
  const [users, setUsers] = React.useState<Array<UserResponse>>([]);
  const upsertUserDialogRef = React.useRef<UpsertUserDialogRef>(null);
  const deleteUserDialogRef = React.useRef<DeleteUserDialogRef>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [selectedInstructions, setSelectedInstructions] = React.useState<string>("");
  const [selectedQuestionsPrompt, setSelectedQuestionsPrompt] = React.useState<string>("");

  React.useEffect(() => {
    getUsers()
      .then((data) => setUsers(data))
      .catch((error) => {
        toast.error("Failed to load users");
        console.error(error);
      });
  }, []);

  return (
    <React.Fragment>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            setUpsertDlgOpen(true);
            upsertUserDialogRef.current?.setUser();
          }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Add New User
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small" aria-label="users table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Name</TableCell>
              <TableCell align="center">Email</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">Template</TableCell>
              <TableCell align="center">Instructions</TableCell>
              <TableCell align="center">Questions Prompt</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell align="center">{user.name}</TableCell>
                <TableCell align="center">{user.email}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.role}
                    color={user.role === "admin" ? "primary" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.template || "template1"}
                    color="secondary"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {user.instructions ? (
                    <Chip
                      label={
                        user.instructions.length > 30
                          ? `${user.instructions.substring(0, 30)}...`
                          : user.instructions
                      }
                      color="info"
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedInstructions(user.instructions || "");
                        setSelectedQuestionsPrompt("");
                      }}
                      sx={{ cursor: "pointer" }}
                    />
                  ) : (
                    <Chip label="None" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  {user.questionsPrompt ? (
                    <Chip
                      label={
                        user.questionsPrompt.length > 30
                          ? `${user.questionsPrompt.substring(0, 30)}...`
                          : user.questionsPrompt
                      }
                      color="success"
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedInstructions("");
                        setSelectedQuestionsPrompt(user.questionsPrompt || "");
                      }}
                      sx={{ cursor: "pointer" }}
                    />
                  ) : (
                    <Chip label="Default" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setUpsertDlgOpen(true);
                      upsertUserDialogRef.current?.setUser(user);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      deleteUserDialogRef.current?.setUserId(user._id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Popover
        open={anchorEl !== null}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setSelectedInstructions("");
          setSelectedQuestionsPrompt("");
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            maxWidth: 500,
            maxHeight: 400,
            p: 2,
            overflow: "auto",
          },
        }}
      >
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
          {selectedInstructions ? "Instructions:" : "Questions Prompt:"}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {selectedInstructions || selectedQuestionsPrompt}
        </Typography>
      </Popover>
      <UpsertUserDialog
        ref={upsertUserDialogRef}
        open={upsertDlgOpen}
        handleClose={() => {
          setUpsertDlgOpen(false);
        }}
        callback={(user, mode) => {
          if (mode === "Create") {
            setUsers((value) => [user, ...value]);
            toast.success(`User "${user.name}" created successfully`);
          } else {
            setUsers((prev) => {
              const index = prev.findIndex((item) => item._id === user._id);
              if (index === -1) return prev;
              return [
                ...prev.slice(0, index),
                user,
                ...prev.slice(index + 1),
              ];
            });
            toast.success(`User "${user.name}" updated successfully`);
          }
        }}
      />
      <DeleteUserDialog
        ref={deleteUserDialogRef}
        callback={(userId) => {
          const deletedUser = users.find((u) => u._id === userId);
          setUsers((prev) => {
            const index = prev.findIndex((item) => item._id === userId);
            if (index === -1) return prev;
            return [...prev.slice(0, index), ...prev.slice(index + 1)];
          });
          if (deletedUser) {
            toast.success(`User "${deletedUser.name}" deleted successfully`);
          }
        }}
      />
    </React.Fragment>
  );
};

export default Users;

