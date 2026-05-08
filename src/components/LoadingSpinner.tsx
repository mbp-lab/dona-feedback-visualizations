import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { SxProps, Theme } from "@mui/material/styles";
import React from "react";

interface LoadingSpinnerProps {
  message: string;
  /** Merged into the info `Alert` (e.g. donor feedback palette). */
  alertSx?: SxProps<Theme>;
  /** Applied to `CircularProgress` (e.g. `{ color: donorCoral }`). */
  spinnerSx?: SxProps<Theme>;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, alertSx, spinnerSx }) => {
  return (
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CircularProgress sx={spinnerSx} />
      <Alert severity="info" sx={[{ mt: 2 }, ...(alertSx ? [alertSx] : [])]}>
        {message}
      </Alert>
    </Box>
  );
};

export default LoadingSpinner;
