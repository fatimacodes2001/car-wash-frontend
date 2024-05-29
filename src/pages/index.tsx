import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useUser } from "../contexts/UserContext";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";

const Home: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user, setUser } = useUser();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchUserDetails = async () => {
        try {
          const response = await axios.get(`${backendUrl}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
          if (response.data.role === "ADMIN") {
            router.push("/admin");
          } else if (response.data.role === "MANAGER") {
            router.push("/manager");
          }
        } catch (error) {
          console.error("Failed to fetch user details:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      };

      fetchUserDetails();
    }
  }, [router, setUser, backendUrl]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${backendUrl}/users/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "MANAGER") {
        router.push("/manager");
      }
    } catch (error) {
      console.error(error);
      alert("Login failed. Please check your credentials and try again.");
    }
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
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 4,
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <Typography component="h1" variant="h5">
            Login
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home;
