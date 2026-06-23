import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { ContentCopy as ContentCopyIcon, Download as DownloadIcon } from "@mui/icons-material";
import {
  getResume,
  downloadCoverLetter,
} from "../../services/resumeService";

export interface CoverLetterDialogProps {
  open: boolean;
  resumeId: string | null;
  handleClose: () => void;
}

const CoverLetterDialog: React.FC<CoverLetterDialogProps> = ({
  open,
  resumeId,
  handleClose,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setCoverLetter(null);
      return;
    }

    // Load existing cover letter if available
    if (resumeId) {
      setIsLoading(true);
      getResume(resumeId)
        .then((resume) => {
          if (resume.coverLetter) {
            let coverLetterText = resume.coverLetter;
            
            // Parse if JSON
            try {
              const parsed = typeof coverLetterText === 'string' ? JSON.parse(coverLetterText) : coverLetterText;
              if (typeof parsed === 'object' && parsed !== null) {
                coverLetterText = parsed.cover_letter || parsed.coverLetter || coverLetterText;
              }
            } catch {
              // Not JSON, use as-is
            }

            // Ensure it's a string and format newlines
            if (typeof coverLetterText !== 'string') {
              coverLetterText = String(coverLetterText);
            }
            coverLetterText = coverLetterText.replace(/\\n/g, '\n');
            coverLetterText = coverLetterText.split("\n\nDear")[1];
            coverLetterText = `Dear${coverLetterText}`;
            
            setCoverLetter(coverLetterText);
          }
        })
        .catch((error) => {
          console.error('Failed to load resume:', error);
          // Don't show error toast, just continue without pre-loading
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, resumeId]);

  const handleCopy = () => {
    if (coverLetter) {
      // Copy the formatted text (newlines will be preserved)
      navigator.clipboard.writeText(coverLetter);
      toast.success("Cover letter copied to clipboard!");
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeId) {
      toast.error("Resume ID is missing");
      return;
    }

    try {
      const response = await downloadCoverLetter(resumeId);
      const pdfBlob = response.data;

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = "Cover Letter.pdf"; // Default fallback

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Cover letter downloaded successfully!");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to download cover letter";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {coverLetter ? "Cover Letter" : "Cover Letter"}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading...</Typography>
          </Box>
        ) : !coverLetter ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography>
              No cover letter found for this resume. Cover letters are generated automatically when a resume is created.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
                minHeight: 400,
                maxHeight: 600,
                overflow: "auto",
              }}
            >
              {coverLetter}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {coverLetter ? (
          <>
            <Button onClick={handleCopy}
              color="secondary" startIcon={<ContentCopyIcon />}>
              Copy as Raw Text
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outlined"
              startIcon={<DownloadIcon />}
              color="secondary"
            >
              Download PDF
            </Button>
            <Button onClick={handleClose} 
              color="secondary">Close</Button>
          </>
        ) : (
          <Button onClick={handleClose}
              color="secondary">Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CoverLetterDialog;
