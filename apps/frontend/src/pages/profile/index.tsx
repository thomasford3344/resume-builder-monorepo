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
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { Link } from "react-router";
import { toast } from "react-toastify";

import {
  getProfile,
  updateProfile,
  revealApiKeys,
  previewTemplate,
  type UserResponse,
  type UpdateProfileDto,
} from "../../services/userService";
import { resizableMultilineSx } from "../../constants/textFieldStyles";
import { alpha } from "@mui/material/styles";

const savedApiKeyFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: (theme: { palette: { success: { main: string } } }) =>
      alpha(theme.palette.success.main, 0.16),
    "& fieldset": {
      borderColor: "success.main",
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: "success.dark",
    },
    "&.Mui-focused fieldset": {
      borderColor: "success.dark",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "success.main",
    opacity: 1,
    fontWeight: 700,
  },
};

const apiKeyInputWrapSx = {
  flex: 1,
  minWidth: 0,
  width: "100%",
};

const apiKeyActionButtonSx = {
  height: 40,
  flexShrink: 0,
  width: { xs: "100%", sm: 148 },
};

const Profile: React.FC = () => {
  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    template: "",
    instructions: "",
    questionsPrompt: "",
    openaiApiKey: "",
    anthropicApiKey: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [clearOpenaiApiKey, setClearOpenaiApiKey] = React.useState(false);
  const [clearAnthropicApiKey, setClearAnthropicApiKey] = React.useState(false);
  const [verifyPassword, setVerifyPassword] = React.useState("");
  const [keysRevealed, setKeysRevealed] = React.useState(false);
  const [revealingKeys, setRevealingKeys] = React.useState(false);
  const [showRevealedKeys, setShowRevealedKeys] = React.useState(true);
  const [revealedSnapshot, setRevealedSnapshot] = React.useState<{
    openai: string | null;
    anthropic: string | null;
  } | null>(null);
  const [apiKeysError, setApiKeysError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = React.useState(false);
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
        openaiApiKey: "",
        anthropicApiKey: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setClearOpenaiApiKey(false);
      setClearAnthropicApiKey(false);
      setVerifyPassword("");
      setKeysRevealed(false);
      setRevealedSnapshot(null);
      setShowRevealedKeys(true);
      setApiKeysError(null);
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
  };

  const handlePreviewTemplate = async () => {
    if (!formData.template) {
      return;
    }

    setPreviewingTemplate(true);
    try {
      const pdfBlob = await previewTemplate(formData.template);
      const url = window.URL.createObjectURL(
        new Blob([pdfBlob], { type: "application/pdf" }),
      );
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Failed to load template preview");
    } finally {
      setPreviewingTemplate(false);
    }
  };

  const handleHideApiKeys = () => {
    setKeysRevealed(false);
    setRevealedSnapshot(null);
    setVerifyPassword("");
    setShowRevealedKeys(true);
    setApiKeysError(null);
    setFormData((prev) => ({
      ...prev,
      openaiApiKey: "",
      anthropicApiKey: "",
    }));
  };

  const handleRevealApiKeys = async () => {
    if (!verifyPassword) {
      setApiKeysError("Enter your current password to view API keys");
      return;
    }

    try {
      setRevealingKeys(true);
      setApiKeysError(null);
      const keys = await revealApiKeys(verifyPassword);
      setRevealedSnapshot({
        openai: keys.openaiApiKey,
        anthropic: keys.anthropicApiKey,
      });
      setFormData((prev) => ({
        ...prev,
        openaiApiKey: keys.openaiApiKey || "",
        anthropicApiKey: keys.anthropicApiKey || "",
      }));
      setKeysRevealed(true);
      setShowRevealedKeys(true);
      toast.success("API keys revealed");
    } catch {
      setApiKeysError("Incorrect password. Could not reveal API keys.");
      toast.error("Failed to reveal API keys");
    } finally {
      setRevealingKeys(false);
    }
  };

  const isOpenaiKeyChanged =
    clearOpenaiApiKey ||
    (formData.openaiApiKey.length > 0 &&
      (!revealedSnapshot ||
        formData.openaiApiKey !== (revealedSnapshot.openai || "")));

  const isAnthropicKeyChanged =
    clearAnthropicApiKey ||
    (formData.anthropicApiKey.length > 0 &&
      (!revealedSnapshot ||
        formData.anthropicApiKey !== (revealedSnapshot.anthropic || "")));

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
        ...(isOpenaiKeyChanged && formData.openaiApiKey && {
          openaiApiKey: formData.openaiApiKey,
        }),
        ...(isAnthropicKeyChanged && formData.anthropicApiKey && {
          anthropicApiKey: formData.anthropicApiKey,
        }),
        ...(clearOpenaiApiKey && { clearOpenaiApiKey: true }),
        ...(clearAnthropicApiKey && { clearAnthropicApiKey: true }),
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
      formData.questionsPrompt !== (user.questionsPrompt || "") ||
      isOpenaiKeyChanged ||
      isAnthropicKeyChanged
    );
    const passwordChanged = formData.newPassword.length > 0;
    return profileChanged || passwordChanged;
  }, [formData, user, isOpenaiKeyChanged, isAnthropicKeyChanged]);

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
            size="small"
            variant="outlined"
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={apiKeyInputWrapSx}>
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
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handlePreviewTemplate}
              disabled={!formData.template || previewingTemplate}
              sx={apiKeyActionButtonSx}
            >
              {previewingTemplate ? "Loading..." : "Preview"}
            </Button>
          </Stack>

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
            API Keys
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Your API keys are encrypted and stored securely. They are used only
            for your resume generation requests.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={apiKeyInputWrapSx}>
              <TextField
                label="Current Password"
                type="password"
                value={verifyPassword}
                onChange={(e) => {
                  setVerifyPassword(e.target.value);
                  setApiKeysError(null);
                }}
                fullWidth
                variant="outlined"
                size="small"
                helperText="Required to view saved API keys"
                disabled={keysRevealed}
              />
            </Box>
            {!keysRevealed ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleRevealApiKeys}
                disabled={
                  revealingKeys ||
                  (!user.hasOpenaiApiKey && !user.hasAnthropicApiKey)
                }
                sx={apiKeyActionButtonSx}
              >
                {revealingKeys ? "Verifying..." : "Show API Keys"}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleHideApiKeys}
                sx={apiKeyActionButtonSx}
              >
                Hide Keys
              </Button>
            )}
          </Stack>

          {apiKeysError && (
            <Alert severity="error">{apiKeysError}</Alert>
          )}

          {keysRevealed && (
            <Alert severity="success">
              API keys are visible below. Hide them when you are done reviewing.
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
            <Box sx={apiKeyInputWrapSx}>
              <TextField
                label="OpenAI API Key"
                type={keysRevealed && showRevealedKeys ? "text" : "password"}
                value={formData.openaiApiKey}
                onChange={(e) => {
                  setClearOpenaiApiKey(false);
                  setFormData((prev) => ({
                    ...prev,
                    openaiApiKey: e.target.value,
                  }));
                }}
                fullWidth
                variant="outlined"
                size="small"
                placeholder={
                  user.hasOpenaiApiKey && !clearOpenaiApiKey && !keysRevealed
                    ? "Key saved (enter new key to replace)"
                    : "sk-..."
                }
                helperText="Used for GPT resume generation"
                sx={
                  user.hasOpenaiApiKey &&
                  !clearOpenaiApiKey &&
                  !keysRevealed &&
                  !formData.openaiApiKey
                    ? savedApiKeyFieldSx
                    : undefined
                }
                InputProps={
                  keysRevealed
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowRevealedKeys((prev) => !prev)
                              }
                              edge="end"
                              aria-label={
                                showRevealedKeys ? "Hide API key" : "Show API key"
                              }
                            >
                              {showRevealedKeys ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    : undefined
                }
              />
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              disabled={!user.hasOpenaiApiKey && !formData.openaiApiKey}
              onClick={() => {
                setFormData((prev) => ({ ...prev, openaiApiKey: "" }));
                setClearOpenaiApiKey(true);
              }}
              sx={apiKeyActionButtonSx}
            >
              Clear
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
            <Box sx={apiKeyInputWrapSx}>
              <TextField
                label="Anthropic API Key"
                type={keysRevealed && showRevealedKeys ? "text" : "password"}
                value={formData.anthropicApiKey}
                onChange={(e) => {
                  setClearAnthropicApiKey(false);
                  setFormData((prev) => ({
                    ...prev,
                    anthropicApiKey: e.target.value,
                  }));
                }}
                fullWidth
                variant="outlined"
                size="small"
                placeholder={
                  user.hasAnthropicApiKey && !clearAnthropicApiKey && !keysRevealed
                    ? "Key saved (enter new key to replace)"
                    : "sk-ant-..."
                }
                helperText="Used for Claude resume generation"
                sx={
                  user.hasAnthropicApiKey &&
                  !clearAnthropicApiKey &&
                  !keysRevealed &&
                  !formData.anthropicApiKey
                    ? savedApiKeyFieldSx
                    : undefined
                }
                InputProps={
                  keysRevealed
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setShowRevealedKeys((prev) => !prev)
                              }
                              edge="end"
                              aria-label={
                                showRevealedKeys ? "Hide API key" : "Show API key"
                              }
                            >
                              {showRevealedKeys ? (
                                <VisibilityOffIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    : undefined
                }
              />
            </Box>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              disabled={!user.hasAnthropicApiKey && !formData.anthropicApiKey}
              onClick={() => {
                setFormData((prev) => ({ ...prev, anthropicApiKey: "" }));
                setClearAnthropicApiKey(true);
              }}
              sx={apiKeyActionButtonSx}
            >
              Clear
            </Button>
          </Stack>

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
            size="small"
          />

          <TextField
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange("newPassword")}
            fullWidth
            variant="outlined"
            helperText="Leave blank to keep current password"
            size="small"
          />

          <TextField
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            fullWidth
            variant="outlined"
            helperText="Must match new password"
            size="small"
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