import * as React from "react";
import { Chip } from "@mui/material";
import { Code as CodeIcon } from "@mui/icons-material";
import { OpenAI, Claude } from "@lobehub/icons";

import {
  DEFAULT_AI_VERSION,
  DEFAULT_OPENAI_VERSION,
  getModelVersionLabel,
  type AiProvider,
} from "../../constants/aiModels";

interface AiVersionBadgeProps {
  aiModel?: AiProvider;
  aiVersion?: string;
  generationSource?: "ai" | "manual";
}

const chipSx = {
  "& .MuiChip-icon": {
    marginLeft: "6px",
    marginRight: "-2px",
  },
  "& .MuiChip-label": {
    pl: 0.75,
  },
};

const AiVersionBadge: React.FC<AiVersionBadgeProps> = ({
  aiModel,
  aiVersion,
  generationSource,
}) => {
  const provider: AiProvider = aiModel || "openai";
  const version =
    aiVersion ||
    (provider === "openai" ? DEFAULT_OPENAI_VERSION : DEFAULT_AI_VERSION);
  const versionLabel = getModelVersionLabel(provider, version);

  if (generationSource === "manual") {
    return (
      <Chip
        size="small"
        variant="outlined"
        icon={<CodeIcon sx={{ fontSize: 16 }} />}
        label={versionLabel}
        sx={chipSx}
      />
    );
  }

  const providerIcon =
    provider === "claude" ? (
      <Claude.Color size={16} />
    ) : (
      <OpenAI size={16} />
    );

  return (
    <Chip
      size="small"
      variant="outlined"
      icon={providerIcon}
      label={versionLabel}
      sx={chipSx}
    />
  );
};

export default AiVersionBadge;
