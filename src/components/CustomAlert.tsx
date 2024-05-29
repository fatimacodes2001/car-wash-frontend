import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface CustomAlertProps {
  open: boolean;
  onClose: () => void;
  severity: "success" | "error" | "warning" | "info";
  message: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  open,
  onClose,
  severity,
  message,
}) => {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomAlert;
