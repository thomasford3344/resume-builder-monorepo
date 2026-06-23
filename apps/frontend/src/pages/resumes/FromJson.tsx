import * as React from "react";
import {
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { generatePdfFromJson } from "../../services/resumeService";
import { useNavigate } from "react-router";
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
    roleType: yup.string().required("Job title is required"),
    jobDescription: yup.string().required("Job description is required"),
    jsonContent: yup
      .string()
      .required("JSON content is required")
      .test("valid-json", "Invalid JSON format", (value) => {
        if (!value?.trim()) return false;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }),
  })
  .required();

type FormData = yup.InferType<typeof schema>;

const FromJson: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [aiModel, setAiModel] = React.useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [aiVersion, setAiVersion] = React.useState(DEFAULT_AI_VERSION);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      companyName: "",
      roleType: "",
      jobDescription: "",
      jsonContent: "",
    },
  });

  const handleAiModelChange = (model: AiProvider, version: string) => {
    setAiModel(model);
    setAiVersion(version);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await generatePdfFromJson({
        companyName: data.companyName,
        roleType: data.roleType,
        jobDescription: data.jobDescription,
        jsonContent: data.jsonContent,
        aiModel,
        aiVersion,
      });
      const pdfBlob = response.data;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "resume.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch?.[1]) {
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

      toast.success("Resume saved and PDF downloaded successfully!");
      navigate("/resumes");
    } catch (error: unknown) {
      const err = error as { response?: { data?: Blob }; message?: string };
      let message = "Failed to generate PDF from JSON";

      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text) as { message?: string | string[] };
          if (parsed.message) {
            message = Array.isArray(parsed.message)
              ? parsed.message.join(", ")
              : parsed.message;
          }
        } catch {
          // use default message
        }
      } else if (err.message) {
        message = err.message;
      }

      toast.error(message);
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
        <Typography variant="h4">Generate from JSON</Typography>
        <Button variant="contained" component={Link} to="/resumes">
          Back to Resumes
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter job details and paste resume JSON. A completed resume record will
        be saved and the PDF will use your profile template.
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
            label="Job Title"
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
            rows={6}
            error={!!errors.jobDescription}
            helperText={errors.jobDescription?.message}
            required
            placeholder="Paste the job description here..."
            disabled={isSubmitting}
            size="small"
            sx={resizableMultilineSx}
          />

          <TextField
            {...register("jsonContent")}
            label="Resume JSON"
            fullWidth
            multiline
            rows={16}
            error={!!errors.jsonContent}
            helperText={
              errors.jsonContent?.message ??
              "Paste the full resume JSON object"
            }
            placeholder='{"name": "...", "title": "...", ...}'
            disabled={isSubmitting}
            size="small"
            sx={resizableMultilineSx}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Generating PDF..." : "Generate PDF"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default FromJson;
