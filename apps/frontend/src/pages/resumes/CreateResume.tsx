import * as React from "react";
import {
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
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router";
import AiModelSelector from "../../components/resumes/AiModelSelector";
import {
  type AiProvider,
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_VERSION,
} from "../../constants/aiModels";
import { resizableMultilineSx } from "../../constants/textFieldStyles";

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

  const [formData, setFormData] = React.useState({
    industry: "default"
  });

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
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

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
            disabled={isSubmitting}
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
