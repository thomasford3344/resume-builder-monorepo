import * as React from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Link } from "react-router";
import { toast } from "react-toastify";

import { getProfile, updateProfile, type UserResponse, type UpdateProfileDto } from "../../services/userService";
import { resizableMultilineSx } from "../../constants/textFieldStyles";

const Profile: React.FC = () => {
  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    template: "",
    instructions: "",
    questionsPrompt: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const templateOptions = [...Array(5)].map((_, index) => ({
    value: `template${index + 1}`,
    label: `Template ${index + 1}`,
  }));

  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setUser(profile);
      setFormData({
        name: profile.name || "",
        template: profile.template || "template1",
        instructions: profile.instructions || "",
        questionsPrompt: profile.questionsPrompt || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleTemplateChange = (option: string) => {
    setFormData(prev => ({
      ...prev,
      "template": option === "" ? "template1" : option
    }));
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate password change
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          setError("Current password is required to change password");
          setSaving(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError("New passwords do not match");
          setSaving(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError("New password must be at least 6 characters long");
          setSaving(false);
          return;
        }
      }

      const updateData: UpdateProfileDto = {
        name: formData.name,
        template: formData.template,
        instructions: formData.instructions,
        questionsPrompt: formData.questionsPrompt,
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      };

      await updateProfile(updateData);
      toast.success("Profile updated successfully");
      await loadProfile(); // Reload to get fresh data
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = React.useMemo(() => {
    if (!user) return false;
    const profileChanged = (
      formData.name !== (user.name || "") ||
      formData.template !== (user.template || "") ||
      formData.instructions !== (user.instructions || "") ||
      formData.questionsPrompt !== (user.questionsPrompt || "")
    );
    const passwordChanged = formData.newPassword.length > 0;
    return profileChanged || passwordChanged;
  }, [formData, user]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load profile</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Profile Settings</Typography>
        <Button variant="contained" component={Link} to="/resumes">
          Back to Resumes
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={handleInputChange("name")}
            fullWidth
            variant="outlined"
          />

          <TextField
            label="Resume Prompt"
            value={formData.instructions}
            onChange={handleInputChange("instructions")}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            helperText="This prompt is used when generating resumes"
            sx={resizableMultilineSx}
          />

          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="template-select-label">Template</InputLabel>
            <Select
              labelId="template-select-label"
              label="Template"
              value={formData.template}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              {templateOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Answers Prompt"
            value={formData.questionsPrompt}
            onChange={handleInputChange("questionsPrompt")}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            helperText="This prompt is used when generating answers to questions"
            sx={resizableMultilineSx}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>

          <TextField
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange("currentPassword")}
            fullWidth
            variant="outlined"
            helperText="Required to change password"
          />

          <TextField
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange("newPassword")}
            fullWidth
            variant="outlined"
            helperText="Leave blank to keep current password"
          />

          <TextField
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            fullWidth
            variant="outlined"
            helperText="Must match new password"
          />

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={loadProfile}
              disabled={saving}
              color="secondary"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              color="secondary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Profile;