import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Paper,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { ContentCopy as ContentCopyIcon } from "@mui/icons-material";
import {
  answerQuestions,
  getResume,
  type AnswerQuestionsDto,
} from "../../services/resumeService";

export interface QuestionsDialogProps {
  open: boolean;
  resumeId: string | null;
  handleClose: () => void;
}

const QuestionsDialog: React.FC<QuestionsDialogProps> = ({
  open,
  resumeId,
  handleClose,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [questions, setQuestions] = React.useState<string>("");
  const [answers, setAnswers] = React.useState<
    Array<{ question: string; answer: string }>
  >([]);

  React.useEffect(() => {
    if (!open) {
      setQuestions("");
      setAnswers([]);
      return;
    }

    // Load existing answers when dialog opens
    if (resumeId) {
      setIsLoading(true);
      getResume(resumeId)
        .then((resume) => {
          if (resume.answers && resume.answers.length > 0) {
            // Clean existing answers to ensure proper structure
            const cleanedAnswers = resume.answers.map((qa) => ({
              question: String(qa.question),
              answer: String(qa.answer),
            }));
            setAnswers(cleanedAnswers);
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

  const handleGenerate = async () => {
    if (!resumeId || !questions.trim()) {
      toast.error("Please enter at least one question");
      return;
    }

    setIsGenerating(true);
    try {
      const payload: AnswerQuestionsDto = {
        resumeId,
        questions: questions, // Send as single text block - AI will parse it
      };

      const response = await answerQuestions(payload);

      // The backend returns questions and answers arrays in the same order
      // Map them to Q&A pairs
      const newQaPairs = response.questions.map((question, index) => ({
        question,
        answer: response.answers[index] || "Unable to generate answer.",
      }));

      // Append new answers to existing ones
      setAnswers((prevAnswers) => [...prevAnswers, ...newQaPairs]);
      setQuestions(""); // Clear the input field
      toast.success("Answers generated successfully!");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate answers";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer);
    toast.success("Answer copied to clipboard!");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {answers.length > 0 ? "Questions & Answers" : "Answer Questions"}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading existing answers...</Typography>
          </Box>
        ) : (
          <>
            {/* Show existing answers */}
            {answers.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Existing Answers ({answers.length})
                </Typography>
                <Stack spacing={2}>
                  {answers.map((qa, index) => (
                    <Paper key={index} sx={{ p: 2 }} elevation={2}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Chip
                          label={`Question ${index + 1}`}
                          color="primary"
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleCopyAnswer(qa.answer)}
                          title="Copy answer"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1, fontStyle: "italic" }}
                      >
                        {qa.question}
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {qa.answer}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Input field for new questions */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {answers.length > 0
                  ? "Enter additional questions below. They will be added to your existing answers."
                  : "Enter questions about the resume or job application. You can paste questions from any source - they will be automatically parsed and cleaned."}
              </Typography>
              <TextField
                label="Questions"
                fullWidth
                multiline
                rows={8}
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="Paste your questions here. They can be separated by blank lines, spaces, or other formatting. Unnecessary text like character counters will be automatically removed.&#10;&#10;Example:&#10;Why are you interested in this position?&#10;&#10;What makes you a good fit for this role?"
                helperText="Paste questions in any format - they will be automatically parsed"
                disabled={isGenerating}
              />
              {isGenerating && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <CircularProgress />
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isGenerating || isLoading} color="secondary">
          Close
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={isGenerating || isLoading || !resumeId || !questions.trim()}
          color="secondary"
        >
          {isGenerating ? "Generating Answers..." : "Generate Answers"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionsDialog;
