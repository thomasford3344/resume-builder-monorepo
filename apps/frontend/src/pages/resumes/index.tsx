import * as React from "react";
import {
  Button,
  Paper,
  Typography,
  Box,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Task as TaskIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  EditDocument as EditIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router";
import {
  getResumes,
  getResume,
  deleteResume,
  bulkDeleteResumes,
  downloadResume,
  // downloadResumeJSON,
  downloadCoverLetter,
  retryResume,
  type ResumeResponse,
  type FilterResumeParams,
  type CoverLetterFormat,
} from "../../services/resumeService";
import { toast } from "react-toastify";
import moment from "moment";
import QuestionsDialog from "../../components/resumes/QuestionsDialog";
import AiVersionBadge from "../../components/resumes/AiVersionBadge";
import { useAuth } from "../../components/common/AuthContext";
import { useThemeMode } from "../../components/common/ThemeContext";
import { useAiModels } from "../../components/common/AiModelsContext";
import ModelProviderIcon from "../../components/common/ModelProviderIcon";
import { getProviderLabel, getRepresentativeModelIdForProvider, resolveModelSelectionInCatalog } from "../../constants/aiModels";
import {
  saveDuplicateResumeDraft,
} from "../../constants/duplicateResumeDraft";
import { chipWithIconSx } from "../../styles/chipWithIcon";
import { getProfile } from "../../services/userService";
import { socket } from "./socket";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const countChipSx = chipWithIconSx;

const sourceChipSelectedSx = {
  bgcolor: "primary.main",
  color: "primary.contrastText",
  borderColor: "primary.main",
  fontWeight: 700,
  boxShadow: 3,
  "& .MuiChip-icon": {
    color: "primary.contrastText",
  },
  "&:hover": {
    bgcolor: "primary.dark",
  },
};

const manualChipSelectedSx = {
  bgcolor: "secondary.main",
  color: "secondary.contrastText",
  borderColor: "secondary.main",
  fontWeight: 700,
  boxShadow: 3,
  "& .MuiChip-icon": {
    color: "secondary.contrastText",
  },
  "&:hover": {
    bgcolor: "secondary.dark",
  },
} as const;

type StatusChipFilter = "completed" | "in_progress" | "failed";
type ChipFilter = StatusChipFilter | "manual" | `provider:${string}`;

function normalizeResumeProvider(aiModel?: string, aiVersion?: string): string {
  if (!aiModel) {
    if (aiVersion?.startsWith("anthropic/")) {
      return "anthropic";
    } else if (aiVersion?.startsWith("openai/")) {
      return "openai";
    }
    return "other";
  }
  if (aiModel === "claude") {
    return "anthropic";
  }
  if (aiModel === "openai") {
    return "openai";
  }

  return aiModel.split("/")[0] || aiModel;
}

const matchesChipFilter = (resume: ResumeResponse, filter: ChipFilter) => {
  switch (filter) {
    case "completed":
      return resume.status === "completed";
    case "in_progress":
      return resume.status === "in_progress";
    case "failed":
      return resume.status === "failed";
    case "manual":
      return resume.generationSource === "manual";
    default:
      if (filter.startsWith("provider:")) {
        const providerId = filter.slice("provider:".length);
        return (
          resume.generationSource !== "manual" &&
          normalizeResumeProvider(resume.aiModel, resume.aiVersion) === providerId
        );
      }
      return true;
  }
};

const Resumes: React.FC = () => {
  const { catalog } = useAiModels();
  const [resumes, setResumes] = React.useState<ResumeResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedResumes, setSelectedResumes] = React.useState<Set<string>>(
    new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteResumeId, setDeleteResumeId] = React.useState<string | null>(
    null,
  );
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterResumeParams>(() => {
    const today = getLocalDateString();
    return {
      companyName: "",
      roleType: "",
      startDate: today,
      endDate: today,
    };
  });
  const [chipFilter, setChipFilter] = React.useState<ChipFilter | null>(null);
  const [generatingCoverLetterId, setGeneratingCoverLetterId] = React.useState<
    string | null
  >(null);
  const [coverLetterMenuAnchor, setCoverLetterMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const [coverLetterMenuResume, setCoverLetterMenuResume] =
    React.useState<ResumeResponse | null>(null);
  const [retryingResumeId, setRetryingResumeId] = React.useState<string | null>(
    null,
  );
  const [editingResumeId, setEditingResumeId] = React.useState<
    string | null
  >(null);
  const [questionsResumeId, setQuestionsResumeId] = React.useState<
    string | null
  >(null);
  const [jobDescriptionDialogOpen, setJobDescriptionDialogOpen] =
    React.useState(false);
  const [selectedJobDescription, setSelectedJobDescription] =
    React.useState<string>("");
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [avatarMenuAnchor, setAvatarMenuAnchor] =
    React.useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, setMode } = useThemeMode();

  const avatarInitial = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : "?";

  const displayName = userName.trim()
    ? userName.trim().split(" ")[0]
    : userEmail.split("@")[0] || "";

  const handleAvatarMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAvatarMenuAnchor(event.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  const handleSettingsClick = () => {
    handleAvatarMenuClose();
    navigate("/settings");
  };

  const handleLogoutClick = () => {
    handleAvatarMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleThemeChange = (nextMode: "light" | "dark") => {
    setMode(nextMode);
    handleAvatarMenuClose();
  };

  React.useEffect(() => {
    getProfile()
      .then((profile) => {
        setUserEmail(profile.email);
        setUserName(profile.name || "");
      })
      .catch(() => {
        // Avatar falls back to "?" if profile cannot be loaded
      });
  }, []);

  const loadResumes = React.useCallback(
    async (
      filterParams?: FilterResumeParams,
      options?: { silent?: boolean },
    ) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        // Build filter object, only including non-empty values
        const activeFilters: FilterResumeParams = {};
        if (filterParams?.companyName?.trim()) {
          activeFilters.companyName = filterParams.companyName.trim();
        }
        if (filterParams?.roleType?.trim()) {
          activeFilters.roleType = filterParams.roleType.trim();
        }
        if (filterParams?.startDate) {
          activeFilters.startDate = filterParams.startDate;
        }
        if (filterParams?.endDate) {
          activeFilters.endDate = filterParams.endDate;
        }

        const data = await getResumes(
          Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        );
        setResumes(data);
      } catch {
        if (!options?.silent) {
          toast.error("Failed to load resumes");
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const filtersRef = React.useRef(filters);
  const loadResumesRef = React.useRef(loadResumes);

  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  React.useEffect(() => {
    loadResumesRef.current = loadResumes;
  }, [loadResumes]);

  React.useEffect(() => {
    const hasInProgress = resumes.some((resume) => resume.status === "in_progress");
    if (!hasInProgress) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadResumesRef.current(filtersRef.current, { silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [resumes]);

  React.useEffect(() => {
    type GenerateDonePayload = {
      id: string;
      message?: string;
    };

    function onGenerateDone({ id }: GenerateDonePayload) {
      let matched = false;
      setResumes((prev) => {
        matched = prev.some((resume) => String(resume._id) === String(id));
        if (!matched) {
          return prev;
        }

        return prev.map((resume) =>
          String(resume._id) === String(id)
            ? { ...resume, status: "completed", failureMessage: undefined }
            : resume,
        );
      });

      if (!matched) {
        void loadResumesRef.current(filtersRef.current, { silent: true });
      }
    }

    function onGenerateFailed({ id, message }: GenerateDonePayload) {
      let matched = false;
      setResumes((prev) => {
        matched = prev.some((resume) => String(resume._id) === String(id));
        if (!matched) {
          return prev;
        }

        return prev.map((resume) =>
          String(resume._id) === String(id)
            ? { ...resume, status: "failed", failureMessage: message }
            : resume,
        );
      });

      if (!matched) {
        void loadResumesRef.current(filtersRef.current, { silent: true });
      }

      if (message) {
        toast.error(message);
      }
    }

    socket.on("generate:done", onGenerateDone);
    socket.on("generate:failed", onGenerateFailed);

    socket.on("connect_error", (e) => {
      toast.error(e?.message ?? "Socket connection error");
    });

    return () => {
      socket.off("generate:done", onGenerateDone);
      socket.off("generate:failed", onGenerateFailed);
      socket.off("connect_error");
    };
  }, []);

  React.useEffect(() => {
    const today = getLocalDateString();
    loadResumes({
      companyName: "",
      roleType: "",
      startDate: today,
      endDate: today,
    });
  }, [loadResumes]);

  const handleFilterChange = (
    field: keyof FilterResumeParams,
    value: string,
  ) => {
    const updatedFilters = {
      ...filters,
      [field]: value,
    };
    setFilters(updatedFilters);
    loadResumes(updatedFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterResumeParams = {
      companyName: "",
      roleType: "",
      startDate: "",
      endDate: "",
    };
    setFilters(emptyFilters);
    setChipFilter(null);
    setSelectedResumes(new Set());
    loadResumes(emptyFilters);
  };

  const handleChipFilterClick = (filter: ChipFilter) => {
    setChipFilter((current) => (current === filter ? null : filter));
    setSelectedResumes(new Set());
  };

  const resumeCounts = React.useMemo(() => {
    const completed = resumes.filter((r) => r.status === "completed").length;
    const inProgress = resumes.filter((r) => r.status === "in_progress").length;
    const failed = resumes.filter((r) => r.status === "failed").length;
    const manual = resumes.filter((r) => r.generationSource === "manual").length;
    const providerCounts = new Map<string, number>();

    for (const resume of resumes) {
      if (resume.generationSource === "manual") {
        continue;
      }

      const providerId = normalizeResumeProvider(resume.aiModel, resume.aiVersion);
      providerCounts.set(
        providerId,
        (providerCounts.get(providerId) ?? 0) + 1,
      );
    }

    return {
      total: resumes.length,
      completed,
      inProgress,
      failed,
      manual,
      providerCounts,
    };
  }, [resumes]);

  const providerFilters = React.useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();

    for (const provider of catalog?.providers ?? []) {
      if ((resumeCounts.providerCounts.get(provider.id) ?? 0) > 0) {
        ordered.push(provider.id);
        seen.add(provider.id);
      }
    }

    for (const providerId of resumeCounts.providerCounts.keys()) {
      if (!seen.has(providerId)) {
        ordered.push(providerId);
        seen.add(providerId);
      }
    }

    return ordered;
  }, [catalog, resumeCounts.providerCounts]);

  const filteredResumes = React.useMemo(() => {
    if (!chipFilter) {
      return resumes;
    }

    return resumes.filter((resume) => matchesChipFilter(resume, chipFilter));
  }, [resumes, chipFilter]);

  const getChipProps = (filter: ChipFilter) => ({
    clickable: true,
    onClick: () => handleChipFilterClick(filter),
    variant: (chipFilter === filter ? "filled" : "outlined") as
      | "filled"
      | "outlined",
    sx: { cursor: "pointer" },
  });

  const getSourceChipProps = (filter: ChipFilter) => {
    const isSelected = chipFilter === filter;
    const isManual = filter === "manual";

    return {
      clickable: true,
      onClick: () => handleChipFilterClick(filter),
      variant: (isSelected ? "filled" : "outlined") as "filled" | "outlined",
      color: isManual ? ("secondary" as const) : undefined,
      sx: {
        ...countChipSx,
        cursor: "pointer",
        borderWidth: isSelected ? 2 : 1,
        transition: "all 0.15s ease",
        ...(isManual
          ? {
            "& .MuiChip-icon": {
              marginLeft: 0,
              marginRight: 0,
            },
            "& .MuiChip-icon svg": {
              marginRight: 0,
            },
          }
          : {}),
        ...(isSelected
          ? isManual
            ? manualChipSelectedSx
            : sourceChipSelectedSx
          : {
            "&:hover": {
              bgcolor: "action.hover",
            },
          }),
      },
    };
  };

  const handleDownloadResume = async (id: string) => {
    try {
      const response = await downloadResume(id);
      const pdfBlob = response.data;

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = "resume.pdf"; // Default fallback

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create download link and trigger download
      // Use the exact filename from server so Chrome replaces the file
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // Use the filename from server
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Resume downloaded successfully!");
    } catch {
      toast.error("Failed to download resume");
    }
  };

  // const handleDownloadResumeJSON = async (id: string) => {
  //   try {
  //     const response = await downloadResumeJSON(id);
  //     const jsonBlob = response.data;
  //
  //     const contentDisposition = response.headers["content-disposition"];
  //     let filename = "resume.json";
  //
  //     if (contentDisposition) {
  //       const filenameMatch = contentDisposition.match(
  //         /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
  //       );
  //       if (filenameMatch && filenameMatch[1]) {
  //         filename = filenameMatch[1].replace(/['"]/g, "");
  //       }
  //     }
  //
  //     const url = window.URL.createObjectURL(jsonBlob);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = filename;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //
  //     toast.success("Resume JSON downloaded successfully!");
  //   } catch {
  //     toast.error("Failed to download resume JSON");
  //   }
  // };

  const triggerBlobDownload = (
    blob: Blob,
    headers: Record<string, string>,
    fallbackFilename: string,
  ) => {
    const contentDisposition = headers["content-disposition"];
    let filename = fallbackFilename;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleOpenCoverLetterMenu = (
    event: React.MouseEvent<HTMLElement>,
    resume: ResumeResponse,
  ) => {
    setCoverLetterMenuAnchor(event.currentTarget);
    setCoverLetterMenuResume(resume);
  };

  const handleCloseCoverLetterMenu = () => {
    setCoverLetterMenuAnchor(null);
    setCoverLetterMenuResume(null);
  };

  const handleDownloadCoverLetter = async (
    resume: ResumeResponse,
    format: CoverLetterFormat,
  ) => {
    handleCloseCoverLetterMenu();
    setGeneratingCoverLetterId(resume._id);

    try {
      const response = await downloadCoverLetter(resume._id, format);
      triggerBlobDownload(
        response.data,
        response.headers,
        format === "txt" ? "Cover_Letter.txt" : "Cover_Letter.pdf",
      );

      toast.success(
        format === "txt"
          ? "Cover letter downloaded as TXT"
          : resume.coverLetter?.trim()
            ? "Cover letter downloaded as PDF"
            : "Cover letter generated and downloaded as PDF",
      );
      setResumes((prev) =>
        prev.map((r) =>
          r._id === resume._id
            ? { ...r, coverLetter: r.coverLetter || "generated" }
            : r,
        ),
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: Blob };
        message?: string;
      };
      let message = "Failed to download cover letter";

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
      setGeneratingCoverLetterId(null);
    }
  };

  const handleRetryResume = async (id: string) => {
    setRetryingResumeId(id);
    try {
      await retryResume(id);
      setResumes((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: "in_progress", failureMessage: undefined }
            : r,
        ),
      );
      toast.success("Resume generation restarted");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const rawMessage = err.response?.data?.message ?? err.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || "Failed to retry resume generation";
      toast.error(message);
    } finally {
      setRetryingResumeId(null);
    }
  };

  const handleEditResume = async (resume: ResumeResponse) => {
    if (resume.status !== "completed") {
      toast.warning("Only completed resumes can be edited");
      return;
    }

    setEditingResumeId(resume._id);
    try {
      let resumeJson = resume.resumeJson;

      if (!resumeJson) {
        const fullResume = await getResume(resume._id);
        resumeJson = fullResume.resumeJson;
      }

      if (!resumeJson || typeof resumeJson !== "object") {
        toast.error("Resume JSON is not available");
        return;
      }

      const normalized = resolveModelSelectionInCatalog(
        resume.aiModel,
        resume.aiVersion,
        catalog,
      );

      saveDuplicateResumeDraft({
        companyName: resume.companyName,
        roleType: resume.roleType,
        jobDescription: resume.jobDescription,
        aiModel: normalized.aiModel,
        aiVersion: normalized.aiVersion,
        jsonContent: JSON.stringify(resumeJson, null, 2),
      });

      navigate("/resumes/new?fromJson=1");
    } catch {
      toast.error("Failed to load resume for editing");
    } finally {
      setEditingResumeId(null);
    }
  };

  const handleSelectResume = (id: string) => {
    setSelectedResumes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedResumes.size === filteredResumes.length) {
      setSelectedResumes(new Set());
    } else {
      setSelectedResumes(new Set(filteredResumes.map((r) => r._id)));
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteResumeId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteResumeId) return;

    setDeleting(true);
    try {
      await deleteResume(deleteResumeId);
      toast.success("Resume deleted successfully!");
      await loadResumes(filters);
      setDeleteDialogOpen(false);
      setDeleteResumeId(null);
    } catch {
      toast.error("Failed to delete resume");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedResumes.size === 0) {
      toast.warning("Please select at least one resume to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedResumes.size === 0) return;

    setDeleting(true);
    try {
      const result = await bulkDeleteResumes({
        ids: Array.from(selectedResumes),
      });
      toast.success(
        `Successfully deleted ${result.deleted} resume(s)${result.failed.length > 0
          ? `. ${result.failed.length} failed to delete.`
          : ""
        }`,
      );
      setSelectedResumes(new Set());
      await loadResumes(filters);
      setBulkDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete resumes");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Job description copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleViewJobDescription = (jobDescription: string) => {
    setSelectedJobDescription(jobDescription);
    setJobDescriptionDialogOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Resumes</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {resumes.length > 0 && selectedResumes.size > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDeleteClick}
            >
              Delete Selected ({selectedResumes.size})
            </Button>
          )}
          <Button
            variant="contained"
            component={Link}
            to="/resumes/new"
            startIcon={<AddIcon />}
          >
            Generate
          </Button>
          <Box
            onClick={handleAvatarMenuOpen}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                width: 40,
                height: 40,
                fontWeight: 600,
              }}
            >
              {avatarInitial}
            </Avatar>
            {displayName && (
              <Typography variant="body1" fontWeight={500} color="text.primary">
                {displayName}
              </Typography>
            )}
          </Box>
          <Menu
            anchorEl={avatarMenuAnchor}
            open={Boolean(avatarMenuAnchor)}
            onClose={handleAvatarMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleSettingsClick}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            {mode === "dark" ? (
              <MenuItem onClick={() => handleThemeChange("light")}>
                <ListItemIcon>
                  <LightModeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Light</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem onClick={() => handleThemeChange("dark")}>
                <ListItemIcon>
                  <DarkModeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dark</ListItemText>
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Log out</ListItemText>
            </MenuItem>
          </Menu>
          <Menu
            anchorEl={coverLetterMenuAnchor}
            open={Boolean(coverLetterMenuAnchor)}
            onClose={handleCloseCoverLetterMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <MenuItem
              onClick={() =>
                coverLetterMenuResume &&
                handleDownloadCoverLetter(coverLetterMenuResume, "pdf")
              }
            >
              <ListItemText>Download PDF</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() =>
                coverLetterMenuResume &&
                handleDownloadCoverLetter(coverLetterMenuResume, "txt")
              }
            >
              <ListItemText>Download TXT</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
            <TextField
              label="Company Name"
              value={filters.companyName || ""}
              onChange={(e) =>
                handleFilterChange("companyName", e.target.value)
              }
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
            <TextField
              label="Role Type"
              value={filters.roleType || ""}
              onChange={(e) => handleFilterChange("roleType", e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
            <TextField
              label="Start Date"
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                handleFilterChange("startDate", e.target.value)
              }
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: "grow" }}>
            <TextField
              label="End Date"
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: "auto" }}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              color="secondary"
              size="small"
              sx={{ height: 40 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading resumes..."
              : chipFilter
                ? `${filteredResumes.length} of ${resumeCounts.total} resume${resumeCounts.total !== 1 ? "s" : ""}`
                : `${resumeCounts.total} resume${resumeCounts.total !== 1 ? "s" : ""}`}
          </Typography>
          {!loading && resumeCounts.total > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                label={`${resumeCounts.completed} completed`}
                size="small"
                color="success"
                {...getChipProps("completed")}
              />
              {resumeCounts.inProgress > 0 && (
                <Chip
                  label={`${resumeCounts.inProgress} in progress`}
                  size="small"
                  color="info"
                  {...getChipProps("in_progress")}
                />
              )}
              {resumeCounts.failed > 0 && (
                <Chip
                  label={`${resumeCounts.failed} failed`}
                  size="small"
                  color="error"
                  {...getChipProps("failed")}
                />
              )}
              {providerFilters.map((providerId) => {
                const filter = `provider:${providerId}` as const;
                return (
                  <Chip
                    key={providerId}
                    icon={
                      <ModelProviderIcon
                        modelId={getRepresentativeModelIdForProvider(
                          catalog,
                          providerId,
                        )}
                      />
                    }
                    label={resumeCounts.providerCounts.get(providerId) ?? 0}
                    size="small"
                    title={getProviderLabel(catalog, providerId)}
                    {...getSourceChipProps(filter)}
                  />
                );
              })}
              <Chip
                icon={<CodeIcon sx={{ fontSize: 16, mr: 0 }} />}
                label={resumeCounts.manual}
                size="small"
                {...getSourceChipProps("manual")}
              />
            </Stack>
          )}
        </Stack>
      </Paper>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : resumes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No resumes found. Create your first resume!
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              component={Link}
              to="/resumes/new"
              startIcon={<AddIcon />}
            >
              Generate
            </Button>
          </Stack>
        </Paper>
      ) : filteredResumes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No resumes match the selected filter.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setChipFilter(null)}
            sx={{ mt: 2 }}
          >
            Clear Filter
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="resumes table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      filteredResumes.length > 0 &&
                      selectedResumes.size === filteredResumes.length
                    }
                    indeterminate={
                      selectedResumes.size > 0 &&
                      selectedResumes.size < filteredResumes.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell align="center">Company Name</TableCell>
                <TableCell align="center">Role Type</TableCell>
                <TableCell align="center">Job Description</TableCell>
                <TableCell align="center">AI Version</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center" colSpan={5}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResumes.map((resume) => (
                <TableRow
                  key={resume._id}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedResumes.has(resume._id)}
                      onChange={() => handleSelectResume(resume._id)}
                    />
                  </TableCell>
                  <TableCell align="center">{resume.companyName}</TableCell>
                  <TableCell align="center">{resume.roleType}</TableCell>
                  <TableCell align="center">
                    {resume.jobDescription ? (
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() =>
                          handleViewJobDescription(resume.jobDescription!)
                        }
                        title="View Job Description"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <AiVersionBadge
                      aiModel={resume.aiModel}
                      aiVersion={resume.aiVersion}
                      generationSource={resume.generationSource}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {resume.status === "in_progress" ? (
                      <CircularProgress size={25} thickness={6} />
                    ) : resume.status === "failed" ? (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Tooltip
                          title={resume.failureMessage || "Generation failed"}
                          arrow
                        >
                          <Chip label="Failed" color="error" size="small" />
                        </Tooltip>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRetryResume(resume._id)}
                          title="Retry generation"
                          disabled={retryingResumeId === resume._id}
                        >
                          {retryingResumeId === resume._id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <RefreshIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Stack>
                    ) : (
                      <Chip label="Completed" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {resume.createdAt
                      ? moment(resume.createdAt).format("MMM DD, YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadResume(resume._id)}
                      title="Download PDF"
                      disabled={resume.status !== "completed"}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                  {/* <TableCell align="center">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleDownloadResumeJSON(resume._id)}
                      title="Download JSON"
                      disabled={resume.status !== "completed"}
                    >
                      <CodeIcon />
                    </IconButton>
                  </TableCell> */}
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color={
                        resume.coverLetter?.trim()
                          ? "success"
                          : "info"
                      }
                      onClick={(event) =>
                        handleOpenCoverLetterMenu(event, resume)
                      }
                      title={
                        resume.generationSource === "manual"
                          ? "Cover letter not available for manual resumes"
                          : "Download cover letter (PDF or TXT)"
                      }
                      disabled={
                        resume.status !== "completed" ||
                        resume.generationSource === "manual" ||
                        generatingCoverLetterId === resume._id
                      }
                    >
                      {generatingCoverLetterId === resume._id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : resume.coverLetter?.trim() ? (
                        <TaskIcon />
                      ) : (
                        <InsertDriveFileIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => setQuestionsResumeId(resume._id)}
                      title={
                        resume.generationSource === "manual"
                          ? "Answer questions not available for manual resumes"
                          : "Answer Questions"
                      }
                      disabled={
                        resume.status !== "completed" ||
                        resume.generationSource === "manual"
                      }
                    >
                      <QuestionAnswerIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleEditResume(resume)}
                      title="Edit in Generate from JSON"
                      disabled={
                        resume.status !== "completed" ||
                        editingResumeId === resume._id
                      }
                    >
                      {editingResumeId === resume._id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <EditIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(resume._id)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Resume</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this resume? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? undefined : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Selected Resumes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedResumes.size} resume(s)?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? undefined : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : `Delete ${selectedResumes.size}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Questions Dialog */}
      <QuestionsDialog
        open={questionsResumeId !== null}
        resumeId={questionsResumeId}
        handleClose={() => setQuestionsResumeId(null)}
      />

      {/* Job Description Dialog */}
      <Dialog
        open={jobDescriptionDialogOpen}
        onClose={() => setJobDescriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Job Description</DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              mt: 1,
            }}
          >
            {selectedJobDescription}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleCopyToClipboard(selectedJobDescription)}
            startIcon={<ContentCopyIcon />}
            color="secondary"
          >
            Copy to Clipboard
          </Button>
          <Button
            color="secondary" onClick={() => setJobDescriptionDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              logout();
              setLogoutDialogOpen(false);
            }}
            color="primary"
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Resumes;
