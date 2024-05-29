import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../contexts/UserContext";
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";
import TopBar from "@/components/TopBar";
import axios from "axios";
import generateReport from "@/utils/generateReport";

const Admin: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || (user && user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [router, user]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleDownloadReport = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const [reportsResponse, locationsResponse] = await Promise.all([
        axios.get(`${backendUrl}/reports`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(`${backendUrl}/locations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      const reports = reportsResponse.data;
      const locations = locationsResponse.data;
      const buffer = generateReport(reports, locations);

      const url = window.URL.createObjectURL(new Blob([buffer]));
      const link = document.createElement("a");
      link.href = url;
      const currDate = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Reports_${currDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage("Report downloaded successfully.");
    } catch (error) {
      console.error("Error downloading report:", error);
      setError("Failed to download report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <TopBar />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "#fff",
          paddingTop: "64px",
        }}
      >
        <Container component="main" maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
            }}
          >
            <Typography component="h1" variant="h5" mb="20px">
              Admin Interface
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Button
                variant="contained"
                onClick={handleDownloadReport}
                sx={{ padding: "10px 20px" }}
              >
                Download Report
              </Button>
            )}
            {message && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Admin;
