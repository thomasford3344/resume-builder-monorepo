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
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { OpenAI, Claude } from "@lobehub/icons";
import { Link, useNavigate } from "react-router";
import {
  getResumes,
  deleteResume,
  bulkDeleteResumes,
  downloadResume,
  downloadResumeJSON,
  generateCoverLetter,
  type ResumeResponse,
  type FilterResumeParams,
} from "../../services/resumeService";
import { toast } from "react-toastify";
import moment from "moment";
import QuestionsDialog from "../../components/resumes/QuestionsDialog";
import AiVersionBadge from "../../components/resumes/AiVersionBadge";
import { useAuth } from "../../components/common/AuthContext";
import { useThemeMode } from "../../components/common/ThemeContext";
import { getProfile } from "../../services/userService";
import { socket } from "./socket";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const countChipSx = {
  "& .MuiChip-icon": {
    marginLeft: "6px",
    marginRight: "-2px",
  },
  "& .MuiChip-label": {
    pl: 0.75,
  },
};

const sourceChipSelectedSx = {
  gpt: {
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
  },
  claude: {
    bgcolor: "#D97757",
    color: "#fff",
    borderColor: "#D97757",
    fontWeight: 700,
    boxShadow: 3,
    "& .MuiChip-icon": {
      color: "#fff",
    },
    "&:hover": {
      bgcolor: "#C96A4D",
    },
  },
  manual: {
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
  },
} as const;

type ChipFilter =
  | "completed"
  | "in_progress"
  | "failed"
  | "gpt"
  | "claude"
  | "manual";

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
    case "gpt":
      return (
        resume.generationSource !== "manual" && resume.aiModel !== "claude"
      );
    case "claude":
      return (
        resume.generationSource !== "manual" && resume.aiModel === "claude"
      );
    default:
      return true;
  }
};

const Resumes: React.FC = () => {
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

  const [connected, setConnected] = React.useState(socket.connected);
  const [error, setError] = React.useState("");

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

  const handleProfileClick = () => {
    handleAvatarMenuClose();
    navigate("/profile");
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
    async (filterParams?: FilterResumeParams) => {
      setLoading(true);
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
        toast.error("Failed to load resumes");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    function onConnect() {
      console.log("connected...")
      setConnected(true);
    }

    function onDisconnect() {
      console.log("disconnected...")
      setConnected(false);
    }

    type GenerateDonePayload = {
      id: string;
    };

    function onGenerateDone({ id }: GenerateDonePayload) {
      setResumes((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "completed" } : r))
      );
    }

    function onGenerateFailed({ id }: GenerateDonePayload) {
      setResumes((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "failed" } : r))
      );
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("generate:done", onGenerateDone);
    socket.on("generate:failed", onGenerateFailed);

    // optional: useful debug
    socket.on("connect_error", (e) => {
      setError(e?.message ?? "Socket connection error");
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("job:done", onGenerateDone);
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
    const gpt = resumes.filter(
      (r) => r.generationSource !== "manual" && r.aiModel !== "claude",
    ).length;
    const claude = resumes.filter(
      (r) => r.generationSource !== "manual" && r.aiModel === "claude",
    ).length;

    return {
      total: resumes.length,
      completed,
      inProgress,
      failed,
      manual,
      gpt,
      claude,
    };
  }, [resumes]);

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

  const getSourceChipProps = (filter: "gpt" | "claude" | "manual") => {
    const isSelected = chipFilter === filter;

    return {
      clickable: true,
      onClick: () => handleChipFilterClick(filter),
      variant: (isSelected ? "filled" : "outlined") as "filled" | "outlined",
      color:
        filter === "gpt"
          ? ("primary" as const)
          : filter === "manual"
            ? ("secondary" as const)
            : undefined,
      sx: {
        ...countChipSx,
        cursor: "pointer",
        borderWidth: isSelected ? 2 : 1,
        transition: "all 0.15s ease",
        ...(isSelected
          ? sourceChipSelectedSx[filter]
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

  const handleDownloadResumeJSON = async (id: string) => {
    try {
      const response = await downloadResumeJSON(id);
      const jsonBlob = response.data;

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = "resume.json"; // Default fallback

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
      const url = window.URL.createObjectURL(jsonBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // Use the filename from server
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Resume JSON downloaded successfully!");
    } catch {
      toast.error("Failed to download resume JSON");
    }
  };

  const handleGenerateCoverLetter = async (id: string) => {
    setGeneratingCoverLetterId(id);
    try {
      const response = await generateCoverLetter(id);
      const pdfBlob = response.data;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "Cover_Letter.pdf";

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

      toast.success("Cover letter generated and downloaded successfully!");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: Blob };
        message?: string;
      };
      let message = "Failed to generate cover letter";

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
            Generate Resume
          </Button>
          <Button
            variant="contained"
            component={Link}
            to="/fromjson"
            startIcon={<CodeIcon />}
          >
            Generate from JSON
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
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
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
        </Stack>
      </Stack>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filter Resumes
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
                <Chip
                  icon={<OpenAI size={16} />}
                  label={resumeCounts.gpt}
                  size="small"
                  {...getSourceChipProps("gpt")}
                />
                <Chip
                  icon={
                    chipFilter === "claude" ? (
                      <Claude size={16} color="#fff" />
                    ) : (
                      <Claude.Color size={16} />
                    )
                  }
                  label={resumeCounts.claude}
                  size="small"
                  {...getSourceChipProps("claude")}
                />
                <Chip
                  icon={<CodeIcon sx={{ fontSize: 16 }} />}
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
              Generate Resume
            </Button>
            <Button
              variant="contained"
              component={Link}
              to="/fromjson"
              startIcon={<CodeIcon />}
            >
              Generate from JSON
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
                {/* <TableCell align="center">AI Model</TableCell> */}
                <TableCell align="center">AI Version</TableCell>
                <TableCell align="center">Job Description</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Created Date</TableCell>
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
                  {/* <TableCell align="center">
                    {resume.aiModel
                      ? getProviderLabel(resume.aiModel as AiProvider)
                      : "-"}
                  </TableCell> */}
                  <TableCell align="center">
                    <AiVersionBadge
                      aiModel={resume.aiModel}
                      aiVersion={resume.aiVersion}
                      generationSource={resume.generationSource}
                    />
                  </TableCell>
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
                    {resume.status === "in_progress" ?
                      <CircularProgress size={25} thickness={6} />
                      :
                      <Chip
                        label={
                          resume.status === "completed"
                            ? "Completed"
                            : "Failed"
                        }
                        color={
                          resume.status === "completed"
                            ? "success"
                            : "error"
                        }
                        size="small"
                      />}
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
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleDownloadResumeJSON(resume._id)}
                      title="Download JSON"
                      disabled={resume.status !== "completed"}
                    >
                      <CodeIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleGenerateCoverLetter(resume._id)}
                      title={
                        resume.generationSource === "manual"
                          ? "Cover letter not available for manual resumes"
                          : "Generate Cover Letter"
                      }
                      disabled={
                        resume.status !== "completed" ||
                        resume.generationSource === "manual" ||
                        generatingCoverLetterId === resume._id
                      }
                    >
                      {generatingCoverLetterId === resume._id ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <DescriptionIcon />
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
