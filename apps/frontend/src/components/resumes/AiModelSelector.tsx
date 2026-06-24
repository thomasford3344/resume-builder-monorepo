import * as React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { OpenAI, Claude } from "@lobehub/icons";
import {
  type AiProvider,
  OPENAI_MODELS,
  CLAUDE_MODELS,
  DEFAULT_OPENAI_VERSION,
  DEFAULT_CLAUDE_VERSION,
  getModelVersionLabel,
} from "../../constants/aiModels";

interface AiModelSelectorProps {
  aiModel: AiProvider;
  aiVersion: string;
  onChange: (aiModel: AiProvider, aiVersion: string) => void;
  disabled?: boolean;
}

const AiModelSelector: React.FC<AiModelSelectorProps> = ({
  aiModel,
  aiVersion,
  onChange,
  disabled = false,
}) => {
  const models = aiModel === "openai" ? OPENAI_MODELS : CLAUDE_MODELS;

  const handleProviderChange = (
    _event: React.MouseEvent<HTMLElement>,
    newProvider: AiProvider | null,
  ) => {
    if (!newProvider) return;

    const defaultVersion =
      newProvider === "openai"
        ? DEFAULT_OPENAI_VERSION
        : DEFAULT_CLAUDE_VERSION;
    onChange(newProvider, defaultVersion);
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, pt: 1 }}>
      <ToggleButtonGroup
        value={aiModel}
        exclusive
        onChange={handleProviderChange}
        disabled={disabled}
        size="small"
        sx={{
          flexShrink: 0,
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
        <ToggleButton value="openai">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <OpenAI size={16} />
            GPT
          </Box>
        </ToggleButton>
        <ToggleButton value="claude">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Claude.Color size={16} />
            Claude
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
      <FormControl
        size="small"
        disabled={disabled}
        sx={{ width: 200, flexShrink: 0 }}
      >
        <InputLabel id="ai-version-label">Model Version</InputLabel>
        <Select
          labelId="ai-version-label"
          label="Model Version"
          value={aiVersion}
          onChange={(e) => onChange(aiModel, e.target.value)}
        >
          {models.map((model) => (
            <MenuItem key={model.value} value={model.value}>
              {getModelVersionLabel(aiModel, model.value)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default AiModelSelector;
