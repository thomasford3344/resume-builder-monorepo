import * as React from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  generateResumeStream,
  type GenerateResumeDto,
} from "../../services/resumeService";
import { getProfile, type UserResponse } from "../../services/userService";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router";
import AiModelSelector from "../../components/resumes/AiModelSelector";
import {
  type AiProvider,
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_VERSION,
} from "../../constants/aiModels";
import { resizableMultilineSx } from "../../constants/textFieldStyles";

const getResumePromptWarning = (
  profile: UserResponse | null,
): string | null => {
  if (!profile) return null;

  if (!profile.instructions?.trim()) {
    return "No resume prompt configured. Add your resume prompt in Profile settings before generating a resume.";
  }

  return null;
};

const getApiKeyWarning = (
  profile: UserResponse | null,
  aiModel: AiProvider,
): string | null => {
  if (!profile) return null;

  if (aiModel === "openai" && !profile.hasOpenaiApiKey) {
    return "No OpenAI API key configured. Add your OpenAI API key in Profile settings before generating with GPT.";
  }

  if (aiModel === "claude" && !profile.hasAnthropicApiKey) {
    return "No Anthropic API key configured. Add your Anthropic API key in Profile settings before generating with Claude.";
  }

  return null;
};

const schema = yup
  .object({
    companyName: yup.string().required("Company name is required"),
    roleType: yup.string().required("Role type is required"),
    jobDescription: yup.string().required("Job description is required")
  })
  .required();

type FormData = yup.InferType<typeof schema>;

const CreateResume: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [aiModel, setAiModel] = React.useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [aiVersion, setAiVersion] = React.useState(DEFAULT_AI_VERSION);
  const [profile, setProfile] = React.useState<UserResponse | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    industry: "default"
  });

  const apiKeyWarning = React.useMemo(
    () => getApiKeyWarning(profile, aiModel),
    [profile, aiModel],
  );

  const resumePromptWarning = React.useMemo(
    () => getResumePromptWarning(profile),
    [profile],
  );

  const isGenerateDisabled =
    isSubmitting || !!apiKeyWarning || !!resumePromptWarning;

  React.useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {
        // Profile warning is optional; submit validation still runs on the server.
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      companyName: "",
      roleType: "",
      jobDescription: ""
    },
  });

  const handleAiModelChange = (model: AiProvider, version: string) => {
    setAiModel(model);
    setAiVersion(version);
    setSubmitError(null);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    if (apiKeyWarning) {
      setSubmitError(apiKeyWarning);
      setIsSubmitting(false);
      return;
    }

    if (resumePromptWarning) {
      setSubmitError(resumePromptWarning);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: GenerateResumeDto = {
        companyName: data.companyName,
        roleType: data.roleType,
        jobDescription: data.jobDescription,
        industry: formData.industry,
        aiModel,
        aiVersion,
      };

      const response = await generateResumeStream(payload);

      if (response.resumeId) {
        toast.success("Resume generation started! Redirecting to resumes page...");
        navigate("/resumes");
        return;
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate resume";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Generate Resume</Typography>
        <Button variant="contained" component={Link} to="/resumes">
          Back to Resumes
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter job details and paste the job description. A tailored resume will
        be generated in the background using your profile prompt and selected AI
        model.
      </Typography>

      {resumePromptWarning && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" component={Link} to="/profile">
              Go to Profile
            </Button>
          }
        >
          {resumePromptWarning}
        </Alert>
      )}

      {apiKeyWarning && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" component={Link} to="/profile">
              Go to Profile
            </Button>
          }
        >
          {apiKeyWarning}
        </Alert>
      )}

      {submitError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setSubmitError(null)}
          action={
            submitError.toLowerCase().includes("profile") ? (
              <Button color="inherit" size="small" component={Link} to="/profile">
                Go to Profile
              </Button>
            ) : undefined
          }
        >
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <AiModelSelector
            aiModel={aiModel}
            aiVersion={aiVersion}
            onChange={handleAiModelChange}
            disabled={isSubmitting}
          />

          <TextField
            {...register("companyName")}
            label="Company Name"
            fullWidth
            error={!!errors.companyName}
            helperText={errors.companyName?.message}
            required
            size="small"
            disabled={isSubmitting}
          />
          <TextField
            {...register("roleType")}
            label="Role Type"
            fullWidth
            error={!!errors.roleType}
            helperText={errors.roleType?.message}
            required
            size="small"
            disabled={isSubmitting}
          />
          <TextField
            {...register("jobDescription")}
            label="Job Description"
            fullWidth
            multiline
            rows={10}
            error={!!errors.jobDescription}
            helperText={errors.jobDescription?.message}
            required
            placeholder="Paste the job description here..."
            disabled={isSubmitting}
            sx={resizableMultilineSx}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isGenerateDisabled}
            fullWidth
          >
            {isSubmitting ? "Generating Resume..." : "Generate Resume"}
          </Button>

        </Stack>
      </form>
    </Paper>
  );
};

export default CreateResume;
