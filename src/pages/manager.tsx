// pages/manager.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useUser } from "../contexts/UserContext";
import { Container, Box, Typography, Paper } from "@mui/material";
import MultiStepForm from "../components/MultiStepForm";
import TopBar from "@/components/TopBar";

interface Location {
  id: number;
  name: string;
}

const Manager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || (user && user.role !== "MANAGER")) {
      router.push("/");
      return;
    }

    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${backendUrl}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(response.data);
      } catch (error) {
        console.error(error);
        alert("Failed to fetch locations.");
      }
    };

    fetchLocations();
  }, [router, backendUrl, user]);
  console.log(locations);

  const handleLocationChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setSelectedLocation(event.target.value as number);
  };

  const handleWeekChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedWeek(event.target.value as string);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#fff",
      }}
    >
      <TopBar />
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxHeight: "500px",
            overflow: "scroll",
          }}
        >
          <Typography component="h1" variant="h5" mb="20px">
            Manager Interface
          </Typography>

          <MultiStepForm
            locations={locations}
            selectedLocation={selectedLocation}
            handleLocationChange={handleLocationChange}
            managerLocationId={user?.manager?.locationId ?? 0}
            selectedWeek={selectedWeek}
            handleWeekChange={handleWeekChange}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default Manager;
