import * as React from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  EditNote as EditNoteIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { Link } from "react-router";
import { toast } from "react-toastify";

import {
  getProfile,
  updateProfile,
  revealApiKeys,
  type UserResponse,
  type UpdateProfileDto,
} from "../../services/userService";
import { downloadTemplatePreview } from "../../services/resumeService";
import { resizableMultilineSx, PROMPT_FIELD_ROWS } from "../../constants/textFieldStyles";
import {
  CUSTOM_PROMPT_HELPER_TEXT,
  DEFAULT_COVER_LETTER_PROMPT,
  DEFAULT_QUESTIONS_PROMPT,
} from "../../constants/aiPrompts";
import AiModelSelector from "../../components/resumes/AiModelSelector";
import {
  type AiProvider,
  resolveUserDefaultAi,
  resolveUserDefaultFromJsonAi,
} from "../../constants/aiModels";
import { useThemeMode } from "../../components/common/ThemeContext";
import {
  ALERT_POSITIONS,
  useToastPosition,
  type AlertPosition,
} from "../../components/common/ToastPositionContext";
import { alpha } from "@mui/material/styles";
import {
  DEFAULT_RESUME_SETTINGS,
  SKILL_CATEGORIES,
  getSkillCategoryLabel,
  resolveResumeSettings,
  resumeSettingsEqual,
  type ResumeSettings,
  type SkillCategory,
} from "../../constants/resumeSettings";

type ProfileSection =
  | "general"
  | "resume"
  | "prompts"
  | "api-keys"
  | "security";

const AUTO_SAVE_DELAY_MS = 800;
const API_KEY_AUTO_SAVE_DELAY_MS = 1000;

const PROFILE_SECTIONS: Array<{
  id: ProfileSection;
  label: string;
  description: string;
  icon: React.ReactElement;
}> = [
  {
    id: "general",
    label: "General",
    description: "Name, appearance, and default AI model",
    icon: <PersonIcon fontSize="small" />,
  },
  {
    id: "resume",
    label: "Resume",
    description: "Template, PDF visibility, and AI generation options",
    icon: <DescriptionIcon fontSize="small" />,
  },
  {
    id: "prompts",
    label: "Prompts",
    description: "Custom instructions for resume generation",
    icon: <EditNoteIcon fontSize="small" />,
  },
  {
    id: "api-keys",
    label: "API Keys",
    description: "OpenAI and Anthropic credentials",
    icon: <KeyIcon fontSize="small" />,
  },
  {
    id: "security",
    label: "Security",
    description: "Update your account password",
    icon: <LockIcon fontSize="small" />,
  },
];

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

const settingsInputRowSx = {
  direction: { xs: "column", sm: "row" },
  spacing: 2,
  alignItems: "flex-start",
} as const;

const settingsInputSpacerSx = {
  ...apiKeyActionButtonSx,
  visibility: "hidden",
  pointerEvents: "none",
};

const resumeCheckboxRowSx = {
  display: "flex",
  alignItems: "flex-start",
  gap: 0.5,
} as const;

function ResumeCheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => void;
}) {
  return (
    <Box sx={resumeCheckboxRowSx}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        size="small"
        sx={{ p: 0.5, mt: -0.25 }}
      />
      <Typography variant="body1" sx={{ pt: 0 }}>
        {label}
      </Typography>
    </Box>
  );
}

const Profile: React.FC = () => {
  const { mode, setMode } = useThemeMode();
  const { position: alertPosition, setPosition: setAlertPosition } =
    useToastPosition();
  const skipAutoSaveRef = React.useRef(true);
  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeSection, setActiveSection] =
    React.useState<ProfileSection>("general");
  const [formData, setFormData] = React.useState({
    name: "",
    template: "",
    instructions: "",
    coverLetterPrompt: "",
    questionsPrompt: "",
    defaultAiModel: "claude" as AiProvider,
    defaultAiVersion: "claude-sonnet-4-6",
    defaultFromJsonAiModel: "openai" as AiProvider,
    defaultFromJsonAiVersion: "gpt-5.5-thinking",
    defaultGenerateFromJson: false,
    openaiApiKey: "",
    anthropicApiKey: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resumeSettingsForm, setResumeSettingsForm] =
    React.useState<ResumeSettings>(DEFAULT_RESUME_SETTINGS);
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
  const [securityError, setSecurityError] = React.useState<string | null>(null);
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [downloadingTemplatePreview, setDownloadingTemplatePreview] =
    React.useState(false);
  const templateOptions = [...Array(6)].map((_, index) => ({
    value: `template${index + 1}`,
    label: `Template ${index + 1}`,
  }));

  const applyApiKeySaveResult = React.useCallback(
    (updateData: UpdateProfileDto) => {
      if (updateData.clearOpenaiApiKey || updateData.openaiApiKey !== undefined) {
        setClearOpenaiApiKey(false);
        if (!keysRevealed) {
          setFormData((prev) => ({ ...prev, openaiApiKey: "" }));
        }
      }

      if (
        updateData.clearAnthropicApiKey ||
        updateData.anthropicApiKey !== undefined
      ) {
        setClearAnthropicApiKey(false);
        if (!keysRevealed) {
          setFormData((prev) => ({ ...prev, anthropicApiKey: "" }));
        }
      }
    },
    [keysRevealed],
  );

  const persistProfile = React.useCallback(
    async (updateData: UpdateProfileDto) => {
      const updated = await updateProfile(updateData);
      setUser(updated);
      applyApiKeySaveResult(updateData);
      return updated;
    },
    [applyApiKeySaveResult],
  );

  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      skipAutoSaveRef.current = true;
      setLoading(true);
      const profile = await getProfile();
      const defaultAi = resolveUserDefaultAi(profile);
      const defaultFromJsonAi = resolveUserDefaultFromJsonAi(profile);
      setUser(profile);
      setResumeSettingsForm(resolveResumeSettings(profile.resumeSettings));
      setFormData({
        name: profile.name || "",
        template: profile.template || "template1",
        instructions: profile.instructions || "",
        coverLetterPrompt: profile.coverLetterPrompt || "",
        questionsPrompt: profile.questionsPrompt || "",
        defaultAiModel: defaultAi.aiModel,
        defaultAiVersion: defaultAi.aiVersion,
        defaultFromJsonAiModel: defaultFromJsonAi.aiModel,
        defaultFromJsonAiVersion: defaultFromJsonAi.aiVersion,
        defaultGenerateFromJson: profile.defaultGenerateFromJson ?? false,
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
      setSecurityError(null);
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
      window.setTimeout(() => {
        skipAutoSaveRef.current = false;
      }, 0);
    }
  };

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTemplateChange = (option: string) => {
    const template = option === "" ? "template1" : option;
    setFormData((prev) => ({
      ...prev,
      template,
    }));

    if (!skipAutoSaveRef.current) {
      void persistProfile({ template }).catch(() => {
        toast.error("Failed to save template");
      });
    }
  };

  const handleDefaultAiModelChange = (model: AiProvider, version: string) => {
    setFormData((prev) => {
      const fromJson = prev.defaultGenerateFromJson;
      const next = fromJson
        ? {
            ...prev,
            defaultFromJsonAiModel: model,
            defaultFromJsonAiVersion: version,
          }
        : {
            ...prev,
            defaultAiModel: model,
            defaultAiVersion: version,
          };

      if (!skipAutoSaveRef.current) {
        void persistProfile(
          fromJson
            ? {
                defaultFromJsonAiModel: model,
                defaultFromJsonAiVersion: version,
              }
            : {
                defaultAiModel: model,
                defaultAiVersion: version,
              },
        ).catch(() => {
          toast.error("Failed to save default AI model");
        });
      }

      return next;
    });
  };

  const handleDefaultGenerateFromJsonChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      defaultGenerateFromJson: checked,
    }));

    if (!skipAutoSaveRef.current) {
      void persistProfile({
        defaultGenerateFromJson: checked,
      }).catch(() => {
        toast.error("Failed to save generate from JSON setting");
      });
    }
  };

  const handleDownloadTemplatePreview = async () => {
    if (!formData.template) {
      return;
    }

    setDownloadingTemplatePreview(true);
    try {
      const response = await downloadTemplatePreview(formData.template);
      const pdfBlob = response.data;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${formData.template}_preview.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template preview");
    } finally {
      setDownloadingTemplatePreview(false);
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

  const handleClearOpenaiKey = async () => {
    setFormData((prev) => ({ ...prev, openaiApiKey: "" }));
    setClearOpenaiApiKey(true);

    try {
      await persistProfile({ clearOpenaiApiKey: true });
    } catch {
      toast.error("Failed to clear OpenAI API key");
    }
  };

  const handleClearAnthropicApiKey = async () => {
    setFormData((prev) => ({ ...prev, anthropicApiKey: "" }));
    setClearAnthropicApiKey(true);

    try {
      await persistProfile({ clearAnthropicApiKey: true });
    } catch {
      toast.error("Failed to clear Anthropic API key");
    }
  };

  const handleChangePassword = async () => {
    setSecurityError(null);

    if (!formData.currentPassword) {
      setSecurityError("Current password is required");
      return;
    }

    if (!formData.newPassword) {
      setSecurityError("New password is required");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setSecurityError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setSecurityError("New password must be at least 6 characters long");
      return;
    }

    try {
      setChangingPassword(true);
      await updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Password updated successfully");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Failed to change password:", error);
      setSecurityError(
        "Failed to change password. Check your current password and try again.",
      );
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  React.useEffect(() => {
    if (skipAutoSaveRef.current || !user) {
      return;
    }

    const updates: UpdateProfileDto = {};

    if (formData.name !== (user.name || "")) {
      updates.name = formData.name;
    }
    if (formData.instructions !== (user.instructions || "")) {
      updates.instructions = formData.instructions;
    }
    if (formData.coverLetterPrompt !== (user.coverLetterPrompt || "")) {
      updates.coverLetterPrompt = formData.coverLetterPrompt;
    }
    if (formData.questionsPrompt !== (user.questionsPrompt || "")) {
      updates.questionsPrompt = formData.questionsPrompt;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistProfile(updates).catch(() => {
        toast.error("Failed to save changes");
      });
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    formData.name,
    formData.instructions,
    formData.coverLetterPrompt,
    formData.questionsPrompt,
    user,
    persistProfile,
  ]);

  React.useEffect(() => {
    if (skipAutoSaveRef.current || !user) {
      return;
    }

    const savedSettings = resolveResumeSettings(user.resumeSettings);
    if (resumeSettingsEqual(resumeSettingsForm, savedSettings)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistProfile({
        resumeSettings: resumeSettingsForm,
      }).catch(() => {
        toast.error("Failed to save resume settings");
      });
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [resumeSettingsForm, user, persistProfile]);

  React.useEffect(() => {
    if (skipAutoSaveRef.current || !user) {
      return;
    }

    if (clearOpenaiApiKey || clearAnthropicApiKey) {
      return;
    }

    if (!isOpenaiKeyChanged && !isAnthropicKeyChanged) {
      return;
    }

    const timer = window.setTimeout(() => {
      const updateData: UpdateProfileDto = {};

      if (formData.openaiApiKey && isOpenaiKeyChanged) {
        updateData.openaiApiKey = formData.openaiApiKey;
      }

      if (formData.anthropicApiKey && isAnthropicKeyChanged) {
        updateData.anthropicApiKey = formData.anthropicApiKey;
      }

      if (Object.keys(updateData).length === 0) {
        return;
      }

      void persistProfile(updateData).catch(() => {
        toast.error("Failed to save API keys");
      });
    }, API_KEY_AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    formData.openaiApiKey,
    formData.anthropicApiKey,
    clearOpenaiApiKey,
    clearAnthropicApiKey,
    isOpenaiKeyChanged,
    isAnthropicKeyChanged,
    user,
    persistProfile,
  ]);

  const activeSectionMeta = PROFILE_SECTIONS.find(
    (section) => section.id === activeSection,
  )!;

  const renderGeneralSection = () => (
    <Stack spacing={3}>
      <Stack {...settingsInputRowSx}>
        <Box sx={apiKeyInputWrapSx}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={handleInputChange("name")}
            fullWidth
            size="small"
            variant="outlined"
          />
        </Box>
        <Box sx={settingsInputSpacerSx} aria-hidden />
      </Stack>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Theme
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Choose light or dark appearance for the app.
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_event, nextMode: "light" | "dark" | null) => {
            if (nextMode) {
              setMode(nextMode);
            }
          }}
          size="small"
          sx={{
            width: "fit-content",
            "& .MuiToggleButton-root": {
              textTransform: "none",
              px: 2,
              gap: 0.75,
            },
            "& .MuiToggleButton-root.Mui-selected": {
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
          }}
        >
          <ToggleButton value="light">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <LightModeIcon fontSize="small" />
              Light
            </Box>
          </ToggleButton>
          <ToggleButton value="dark">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <DarkModeIcon fontSize="small" />
              Dark
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Alert position
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Choose where toast notifications appear in the app.
        </Typography>
        <ToggleButtonGroup
          value={alertPosition}
          exclusive
          onChange={(_event, nextPosition: AlertPosition | null) => {
            if (nextPosition) {
              setAlertPosition(nextPosition);
              window.setTimeout(() => {
                toast.info("This is a sample alert.");
              }, 200);
            }
          }}
          size="small"
          sx={{
            width: "fit-content",
            "& .MuiToggleButton-root": {
              textTransform: "none",
              px: 2,
            },
            "& .MuiToggleButton-root.Mui-selected": {
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
          }}
        >
          {ALERT_POSITIONS.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Default AI Model
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Pre-selected mode, provider and version on the Generate Resume page.
        </Typography>
        <Stack spacing={2}>
          <ResumeCheckboxRow
            label="Generate from JSON"
            checked={formData.defaultGenerateFromJson}
            onChange={handleDefaultGenerateFromJsonChange}
          />
          <AiModelSelector
            aiModel={
              formData.defaultGenerateFromJson
                ? formData.defaultFromJsonAiModel
                : formData.defaultAiModel
            }
            aiVersion={
              formData.defaultGenerateFromJson
                ? formData.defaultFromJsonAiVersion
                : formData.defaultAiVersion
            }
            onChange={handleDefaultAiModelChange}
          />
        </Stack>
      </Box>
    </Stack>
  );

  const renderPromptsSection = () => (
    <Stack spacing={3}>
      <TextField
        label="Resume Prompt"
        value={formData.instructions}
        onChange={handleInputChange("instructions")}
        fullWidth
        multiline
        rows={PROMPT_FIELD_ROWS}
        variant="outlined"
        helperText="This prompt is used when generating resumes"
        sx={resizableMultilineSx}
      />

      <TextField
        label="Cover Letter Prompt"
        value={formData.coverLetterPrompt}
        onChange={handleInputChange("coverLetterPrompt")}
        fullWidth
        multiline
        rows={PROMPT_FIELD_ROWS}
        variant="outlined"
        placeholder={DEFAULT_COVER_LETTER_PROMPT}
        helperText={CUSTOM_PROMPT_HELPER_TEXT}
        sx={resizableMultilineSx}
      />

      <TextField
        label="Answers Prompt"
        value={formData.questionsPrompt}
        onChange={handleInputChange("questionsPrompt")}
        fullWidth
        multiline
        rows={PROMPT_FIELD_ROWS}
        variant="outlined"
        placeholder={DEFAULT_QUESTIONS_PROMPT}
        helperText={CUSTOM_PROMPT_HELPER_TEXT}
        sx={resizableMultilineSx}
      />
    </Stack>
  );

  const renderApiKeysSection = () => (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        Your API keys are encrypted and stored securely. They are used only for
        your resume generation requests.
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
              (!user!.hasOpenaiApiKey && !user!.hasAnthropicApiKey)
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

      {apiKeysError && <Alert severity="error">{apiKeysError}</Alert>}

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
              user!.hasOpenaiApiKey && !clearOpenaiApiKey && !keysRevealed
                ? "Key saved (enter new key to replace)"
                : "sk-..."
            }
            helperText="Used for GPT resume generation"
            sx={
              user!.hasOpenaiApiKey &&
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
          disabled={!user!.hasOpenaiApiKey && !formData.openaiApiKey}
          onClick={() => {
            void handleClearOpenaiKey();
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
              user!.hasAnthropicApiKey && !clearAnthropicApiKey && !keysRevealed
                ? "Key saved (enter new key to replace)"
                : "sk-ant-..."
            }
            helperText="Used for Claude resume generation"
            sx={
              user!.hasAnthropicApiKey &&
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
          disabled={!user!.hasAnthropicApiKey && !formData.anthropicApiKey}
          onClick={() => {
            void handleClearAnthropicApiKey();
          }}
          sx={apiKeyActionButtonSx}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );

  const handleResumeCountChange =
    (field: keyof Pick<
      ResumeSettings,
      | "responsibilitiesCount"
      | "achievementsCount"
      | "skillsPerCategoryCount"
      | "companySkillsCount"
    >) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = Number.parseInt(event.target.value, 10);
      setResumeSettingsForm((prev) => ({
        ...prev,
        [field]: Number.isFinite(parsed) ? parsed : 0,
      }));
    };

  const handleSkillCategoryToggle =
    (category: SkillCategory) =>
    (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setResumeSettingsForm((prev) => {
        const nextCategories = checked
          ? [...prev.skillCategories, category]
          : prev.skillCategories.filter((item) => item !== category);

        return {
          ...prev,
          skillCategories:
            nextCategories.length > 0 ? nextCategories : [...SKILL_CATEGORIES],
        };
      });
    };

  const renderResumeSection = () => (
    <Stack spacing={3}>
      <Stack {...settingsInputRowSx}>
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
          onClick={handleDownloadTemplatePreview}
          disabled={!formData.template || downloadingTemplatePreview}
          sx={apiKeyActionButtonSx}
        >
          {downloadingTemplatePreview ? "Downloading..." : "Download Preview"}
        </Button>
      </Stack>

      <Divider />

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          PDF visibility
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Control which sections appear in generated resume PDF files.
        </Typography>
        <Stack spacing={0.5}>
          <ResumeCheckboxRow
            label="Title"
            checked={resumeSettingsForm.showTitle}
            onChange={(_event, checked) =>
              setResumeSettingsForm((prev) => ({
                ...prev,
                showTitle: checked,
              }))
            }
          />
          <ResumeCheckboxRow
            label='Subtitles ("Key Qualifications & Responsibilities", "Key Achievements")'
            checked={resumeSettingsForm.showSubTitle}
            onChange={(_event, checked) =>
              setResumeSettingsForm((prev) => ({
                ...prev,
                showSubTitle: checked,
              }))
            }
          />
          <ResumeCheckboxRow
            label="Skills in company"
            checked={resumeSettingsForm.showCompanySkills}
            onChange={(_event, checked) =>
              setResumeSettingsForm((prev) => ({
                ...prev,
                showCompanySkills: checked,
              }))
            }
          />
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Skill categories
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Selected categories are used in AI resume generation. At least one
          category must remain enabled.
        </Typography>
        <Stack spacing={0.5}>
          {SKILL_CATEGORIES.map((category) => (
            <ResumeCheckboxRow
              key={category}
              label={getSkillCategoryLabel(category)}
              checked={resumeSettingsForm.skillCategories.includes(category)}
              onChange={handleSkillCategoryToggle(category)}
            />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          AI output format
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          When enabled, generation uses the built-in JSON schema with the counts
          below. When disabled, output structure comes from your resume prompt
          only.
        </Typography>
        <ResumeCheckboxRow
          label="Use default output format"
          checked={resumeSettingsForm.useDefaultOutputFormat}
          onChange={(_event, checked) =>
            setResumeSettingsForm((prev) => ({
              ...prev,
              useDefaultOutputFormat: checked,
            }))
          }
        />
      </Box>

      {resumeSettingsForm.useDefaultOutputFormat && (
        <>
          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Generation counts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These values set minimum item counts in the AI JSON schema.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Responsibilities per role"
                type="number"
                size="small"
                inputProps={{ min: 0, max: 30 }}
                value={resumeSettingsForm.responsibilitiesCount}
                onChange={handleResumeCountChange("responsibilitiesCount")}
                sx={{ maxWidth: 320 }}
              />
              <TextField
                label="Achievements per role"
                type="number"
                size="small"
                inputProps={{ min: 0, max: 30 }}
                value={resumeSettingsForm.achievementsCount}
                onChange={handleResumeCountChange("achievementsCount")}
                sx={{ maxWidth: 320 }}
              />
              <TextField
                label="Skills per category"
                type="number"
                size="small"
                inputProps={{ min: 0, max: 30 }}
                value={resumeSettingsForm.skillsPerCategoryCount}
                onChange={handleResumeCountChange("skillsPerCategoryCount")}
                sx={{ maxWidth: 320 }}
              />
              <TextField
                label="Company skills per role"
                type="number"
                size="small"
                inputProps={{ min: 0, max: 30 }}
                value={resumeSettingsForm.companySkillsCount}
                onChange={handleResumeCountChange("companySkillsCount")}
                sx={{ maxWidth: 320 }}
              />
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );

  const renderSecuritySection = () => (
    <Stack spacing={3}>
      {securityError && <Alert severity="error">{securityError}</Alert>}

      <Stack {...settingsInputRowSx}>
        <Box sx={apiKeyInputWrapSx}>
          <TextField
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange("currentPassword")}
            fullWidth
            variant="outlined"
            helperText="Required to change your password"
            size="small"
          />
        </Box>
        <Box sx={settingsInputSpacerSx} aria-hidden />
      </Stack>

      <Stack {...settingsInputRowSx}>
        <Box sx={apiKeyInputWrapSx}>
          <TextField
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange("newPassword")}
            fullWidth
            variant="outlined"
            helperText="Must be at least 6 characters"
            size="small"
          />
        </Box>
        <Box sx={settingsInputSpacerSx} aria-hidden />
      </Stack>

      <Stack {...settingsInputRowSx}>
        <Box sx={apiKeyInputWrapSx}>
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
        </Box>
        <Box sx={settingsInputSpacerSx} aria-hidden />
      </Stack>

      <Box>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleChangePassword}
          disabled={changingPassword}
        >
          {changingPassword ? "Changing Password..." : "Change Password"}
        </Button>
      </Box>
    </Stack>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "general":
        return renderGeneralSection();
      case "resume":
        return renderResumeSection();
      case "prompts":
        return renderPromptsSection();
      case "api-keys":
        return renderApiKeysSection();
      case "security":
        return renderSecuritySection();
      default:
        return null;
    }
  };

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
        <Typography variant="h4">Settings</Typography>
        <Button
          variant="contained"
          component={Link}
          to="/resumes"
          startIcon={<ArrowBackIcon />}
        >
          Resumes
        </Button>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Paper
          sx={{
            width: { xs: "100%", md: 240 },
            flexShrink: 0,
            p: 1,
          }}
        >
          <List disablePadding>
            {PROFILE_SECTIONS.map((section) => (
              <ListItemButton
                key={section.id}
                selected={activeSection === section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSecurityError(null);
                }}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    "&:hover": {
                      bgcolor: "secondary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "secondary.contrastText",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 3, pb: 6 }}>
            <Typography variant="h6" gutterBottom>
              {activeSectionMeta.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeSectionMeta.description}
            </Typography>
            {renderActiveSection()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Profile;
