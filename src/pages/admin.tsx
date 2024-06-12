import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../contexts/UserContext";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
} from "@mui/material";
import TopBar from "@/components/TopBar";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import generateReport from "@/utils/generateReport";

dayjs.extend(weekday);

const Admin = () => {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [reportAvailability, setReportAvailability] = useState([]);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (selectedWeek) {
      fetchReportAvailability();
    }
  }, [selectedWeek]);

  const handleDownloadReport = async () => {
    setLoading(true);
    setMessage("");
    setError("");
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

  const fetchReportAvailability = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/report-availability/${selectedWeek}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setReportAvailability(response.data);
    } catch (error) {
      console.error("Error fetching report availability:", error);
      setError("Failed to fetch report availability.");
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (event: any) => {
    setSelectedWeek(event.target.value);
  };

  const getLastFourWeeks = () => {
    const today = dayjs();
    const lastMonday = today.day(today.day() >= 1 ? 1 : -6);
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const startOfWeek = lastMonday.subtract(i, "week");
      weeks.push({
        label: `${startOfWeek.format("MMM D, YYYY")} - ${startOfWeek
          .add(6, "day")
          .format("MMM D, YYYY")}`,
        value: startOfWeek.format("YYYY-MM-DD"),
      });
    }
    return weeks.reverse();
  };

  const columns = [
    {
      name: "name",
      label: "Location",
    },
    {
      name: "isDataAvailable",
      label: "Data Available",
      options: {
        customBodyRender: (value: string) => (value ? "✅" : "❌"),
      },
    },
  ];

  const options = {
    filterType: "checkbox",
    responsive: "standard",
    selectableRows: "none",
    rowsPerPage: 5,
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
            }}
          >
            <Typography component="h1" variant="h5">
              Admin Interface
            </Typography>
            <Button
              variant="contained"
              onClick={handleDownloadReport}
              sx={{ mt: 2, mb: 2 }}
            >
              Download Report
            </Button>
            <Select
              value={selectedWeek}
              onChange={handleWeekChange}
              displayEmpty
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ "aria-label": "Without label" }}
            >
              {getLastFourWeeks().map((week) => (
                <MenuItem key={week.value} value={week.value}>
                  {week.label}
                </MenuItem>
              ))}
            </Select>
            {selectedWeek && (
              <MUIDataTable
                title={"Report Availability"}
                data={reportAvailability}
                columns={columns}
                options={options as any}
              />
            )}

            {loading && <CircularProgress />}
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Admin;
