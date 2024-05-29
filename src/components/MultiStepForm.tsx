import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  DialogTitle,
  Paper,
  CircularProgress,
} from "@mui/material";
import dayjs from "dayjs";
import axios from "axios";
import CustomAlert from "./CustomAlert";

const convertToISODate = (weekString: string) => {
  const startDateString = weekString.split(" - ")[0];
  const parsedDate = dayjs(startDateString, "MMM D, YYYY");
  return parsedDate.format("YYYY-MM-DD");
};

interface Location {
  id: number;
  name: string;
}

interface MultiStepFormProps {
  locations: Location[];
  selectedLocation: number | null;
  handleLocationChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
  managerLocationId: number;
  selectedWeek: string | null;
  handleWeekChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({
  locations,
  selectedLocation,
  handleLocationChange,
  managerLocationId,
  selectedWeek,
  handleWeekChange,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reportData, setReportData] = useState({
    carCountMonFri: "",
    carCountSatSun: "",
    retailCarCountMonFri: "",
    retailCarCountSatSun: "",
    retailRevenueMonFri: "",
    retailRevenueSatSun: "",
    totalRevenueMonFri: "",
    totalRevenueSatSun: "",
    staffHoursMonFri: "",
    staffHoursSatSun: "",
    totalClubPlanMembers: "",
    totalClubPlansSold: "",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<
    "error" | "warning" | "info" | "success"
  >("info");
  const steps = ["Choose Location", "Choose Week", "Add Data", "Review Data"];
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const checkIfReportExists = async () => {
    if (!selectedWeek || !selectedLocation) return [null, false];

    const weekStartDate = convertToISODate(selectedWeek);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${backendUrl}/reports/${selectedLocation}/${weekStartDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      let repData = {
        carCountMonFri: "",
        carCountSatSun: "",
        retailCarCountMonFri: "",
        retailCarCountSatSun: "",
        retailRevenueMonFri: "",
        retailRevenueSatSun: "",
        totalRevenueMonFri: "",
        totalRevenueSatSun: "",
        staffHoursMonFri: "",
        staffHoursSatSun: "",
        totalClubPlanMembers: "",
        totalClubPlansSold: "",
      };
      let repExists = false;

      if (response.data) {
        repExists = true;
        repData = {
          carCountMonFri: response.data.carCountMonFri.toString(),
          carCountSatSun: response.data.carCountSatSun.toString(),
          retailCarCountMonFri: response.data.retailCarCountMonFri.toString(),
          retailCarCountSatSun: response.data.retailCarCountSatSun.toString(),
          retailRevenueMonFri: response.data.retailRevenueMonFri.toString(),
          retailRevenueSatSun: response.data.retailRevenueSatSun.toString(),
          totalRevenueMonFri: response.data.totalRevenueMonFri.toString(),
          totalRevenueSatSun: response.data.totalRevenueSatSun.toString(),
          staffHoursMonFri: response.data.staffHoursMonFri.toString(),
          staffHoursSatSun: response.data.staffHoursSatSun.toString(),
          totalClubPlanMembers: response.data.totalClubPlanMembers.toString(),
          totalClubPlansSold: response.data.totalClubPlansSold.toString(),
        };
      }
      setReportData(repData);
      console.log("Report data:", repData, repExists);
      return [repData, repExists];
    } catch (error) {
      console.error("Error fetching report data:", error);
      return [null, false];
    }
  };

  const handleNext = async () => {
    if (activeStep === 0 && selectedLocation !== managerLocationId) {
      setAlertMessage("Please choose your own assigned location.");
      setAlertSeverity("warning");
      setAlertOpen(true);

      return;
    }

    if (activeStep === 1) {
      const reportDataPayload = await checkIfReportExists();
      if (reportDataPayload[1]) {
        setOpenDialog(true);
        return;
      }
    }

    if (
      activeStep === 2 &&
      Object.values(reportData).some((value) => value === "")
    ) {
      return;
    }

    if (activeStep === steps.length - 1) {
      submitReport();
    }

    setAlertMessage("");
    setAlertSeverity("info");
    setAlertOpen(false);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleDialogClose = (confirm: boolean) => {
    setOpenDialog(false);
    if (confirm) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setReportData({
      carCountMonFri: "",
      carCountSatSun: "",
      retailCarCountMonFri: "",
      retailCarCountSatSun: "",
      retailRevenueMonFri: "",
      retailRevenueSatSun: "",
      totalRevenueMonFri: "",
      totalRevenueSatSun: "",
      staffHoursMonFri: "",
      staffHoursSatSun: "",
      totalClubPlanMembers: "",
      totalClubPlansSold: "",
    });
    setSubmitStatus(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setReportData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const getLastFourWeeks = () => {
    const today = dayjs();
    const lastMonday = today.day(today.day() >= 1 ? 1 : -6);
    const weeks = [];
    for (let i = 1; i <= 4; i++) {
      const startOfWeek = lastMonday.subtract(i, "week");
      const endOfWeek = startOfWeek.add(6, "day");
      const weekLabel = `${startOfWeek.format(
        "MMM D, YYYY"
      )} - ${endOfWeek.format("MMM D, YYYY")}`;
      weeks.push({
        name: weekLabel,
        value: weekLabel,
      });
    }
    return weeks;
  };

  const lastFourWeeks = getLastFourWeeks();

  const calculateMetrics = () => {
    const carCountMonFri = parseInt(reportData.carCountMonFri) || 0;
    const carCountSatSun = parseInt(reportData.carCountSatSun) || 0;
    const retailCarCountMonFri = parseInt(reportData.retailCarCountMonFri) || 0;
    const retailCarCountSatSun = parseInt(reportData.retailCarCountSatSun) || 0;
    const retailRevenueMonFri = parseFloat(reportData.retailRevenueMonFri) || 0;
    const retailRevenueSatSun = parseFloat(reportData.retailRevenueSatSun) || 0;
    const totalRevenueMonFri = parseFloat(reportData.totalRevenueMonFri) || 0;
    const totalRevenueSatSun = parseFloat(reportData.totalRevenueSatSun) || 0;
    const staffHoursMonFri = parseFloat(reportData.staffHoursMonFri) || 0;
    const staffHoursSatSun = parseFloat(reportData.staffHoursSatSun) || 0;
    const totalClubPlansSold = parseFloat(reportData.totalClubPlansSold) || 0;

    const totalCars = carCountMonFri + carCountSatSun;
    const totalRevenue = totalRevenueMonFri + totalRevenueSatSun;
    const totalRetailCarCount = retailCarCountMonFri + retailCarCountSatSun;
    const totalRetailRevenue = retailRevenueMonFri + retailRevenueSatSun;
    const avgRetailVisit = totalRetailCarCount
      ? totalRetailRevenue / totalRetailCarCount
      : 0;
    const avgMemberVisit =
      totalCars && totalCars - totalRetailCarCount
        ? (totalRevenue - totalRetailRevenue) /
          (totalCars - totalRetailCarCount)
        : 0;
    const carsPerLaborHourMonFri = staffHoursMonFri
      ? carCountMonFri / staffHoursMonFri
      : 0;
    const carsPerLaborHourSatSun = staffHoursSatSun
      ? carCountSatSun / staffHoursSatSun
      : 0;
    const totalCarsPerManHour =
      staffHoursMonFri + staffHoursSatSun
        ? totalCars / (staffHoursMonFri + staffHoursSatSun)
        : 0;
    const conversionRate = totalRetailCarCount
      ? totalClubPlansSold / totalRetailCarCount
      : 0;

    return {
      totalCars,
      totalRevenue,
      avgRetailVisit,
      avgMemberVisit,
      carsPerLaborHourMonFri,
      carsPerLaborHourSatSun,
      totalCarsPerManHour,
      conversionRate,
    };
  };

  const metrics = calculateMetrics();

  const convertToFloat = (value: string) => {
    const floatValue = parseFloat(value);
    return isNaN(floatValue) ? 0 : floatValue;
  };

  const submitReport = async () => {
    setLoading(true);
    const weekStartDate = convertToISODate(selectedWeek!);
    const weekEndDate = dayjs(weekStartDate).add(6, "day").format("YYYY-MM-DD");

    const floatReportData = {
      carCountMonFri: convertToFloat(reportData.carCountMonFri),
      carCountSatSun: convertToFloat(reportData.carCountSatSun),
      retailCarCountMonFri: convertToFloat(reportData.retailCarCountMonFri),
      retailCarCountSatSun: convertToFloat(reportData.retailCarCountSatSun),
      retailRevenueMonFri: convertToFloat(reportData.retailRevenueMonFri),
      retailRevenueSatSun: convertToFloat(reportData.retailRevenueSatSun),
      totalRevenueMonFri: convertToFloat(reportData.totalRevenueMonFri),
      totalRevenueSatSun: convertToFloat(reportData.totalRevenueSatSun),
      staffHoursMonFri: convertToFloat(reportData.staffHoursMonFri),
      staffHoursSatSun: convertToFloat(reportData.staffHoursSatSun),
      totalClubPlanMembers: convertToFloat(reportData.totalClubPlanMembers),
      totalClubPlansSold: convertToFloat(reportData.totalClubPlansSold),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${backendUrl}/reports`,
        {
          locationId: selectedLocation,
          weekStartDate,
          weekEndDate,
          ...floatReportData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error creating report:", error);
      setSubmitStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <React.Fragment>
          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <React.Fragment>
              {submitStatus === "success" ? (
                <Typography sx={{ mt: 2, mb: 1 }}>
                  <strong>Report created successfully!</strong>
                </Typography>
              ) : submitStatus === "error" ? (
                <Typography sx={{ mt: 2, mb: 1 }}>
                  <strong>Report creation failed. Please try again.</strong>
                </Typography>
              ) : null}
              <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
                <Button onClick={handleReset}>
                  {submitStatus === "success" ? "Start Over" : "Back"}
                </Button>
              </Box>
            </React.Fragment>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Box sx={{ mt: 2, mb: 1 }}>
            {activeStep === 0 && (
              <FormControl fullWidth>
                <InputLabel id="location-label">Location</InputLabel>
                <Select
                  labelId="location-label"
                  id="location"
                  value={selectedLocation ?? ""}
                  onChange={handleLocationChange}
                  label="Location"
                >
                  <MenuItem value="">
                    <em>Select Location</em>
                  </MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {activeStep === 1 && (
              <FormControl fullWidth>
                <InputLabel id="week-label">Week</InputLabel>
                <Select
                  labelId="week-label"
                  id="week"
                  value={selectedWeek ?? ""}
                  onChange={handleWeekChange}
                  label="Week"
                >
                  <MenuItem value="">
                    <em>Select Week</em>
                  </MenuItem>
                  {lastFourWeeks.map((week) => (
                    <MenuItem key={week.value} value={week.value}>
                      {week.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {activeStep === 2 && (
              <Box component="form" noValidate autoComplete="off">
                <TextField
                  fullWidth
                  margin="normal"
                  label="Car Count (Mon-Fri)"
                  name="carCountMonFri"
                  type="number"
                  value={reportData.carCountMonFri}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Car Count (Sat-Sun)"
                  name="carCountSatSun"
                  type="number"
                  value={reportData.carCountSatSun}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Retail Car Count (Mon-Fri)"
                  name="retailCarCountMonFri"
                  type="number"
                  value={reportData.retailCarCountMonFri}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Retail Car Count (Sat-Sun)"
                  name="retailCarCountSatSun"
                  type="number"
                  value={reportData.retailCarCountSatSun}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Retail Revenue (Mon-Fri)"
                  name="retailRevenueMonFri"
                  type="number"
                  value={reportData.retailRevenueMonFri}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Retail Revenue (Sat-Sun)"
                  name="retailRevenueSatSun"
                  type="number"
                  value={reportData.retailRevenueSatSun}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Total Revenue (Mon-Fri)"
                  name="totalRevenueMonFri"
                  type="number"
                  value={reportData.totalRevenueMonFri}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Total Revenue (Sat-Sun)"
                  name="totalRevenueSatSun"
                  type="number"
                  value={reportData.totalRevenueSatSun}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Staff Hours (Mon-Fri)"
                  name="staffHoursMonFri"
                  type="number"
                  value={reportData.staffHoursMonFri}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Staff Hours (Sat-Sun)"
                  name="staffHoursSatSun"
                  type="number"
                  value={reportData.staffHoursSatSun}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Total Club Plans Sold"
                  name="totalClubPlansSold"
                  type="number"
                  value={reportData.totalClubPlansSold}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Total Club Plan Members"
                  name="totalClubPlanMembers"
                  type="number"
                  value={reportData.totalClubPlanMembers}
                  onChange={handleChange}
                />
              </Box>
            )}
            {activeStep === 3 && (
              <Box>
                <Typography variant="h6">Review Data</Typography>
                <ReviewDataTable reportData={reportData} metrics={metrics} />
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />
            <Button
              onClick={handleNext}
              disabled={
                (activeStep === 1 && !selectedWeek) ||
                (activeStep === 2 &&
                  Object.values(reportData).some((value) => value === ""))
              }
            >
              {activeStep === steps.length - 1 ? "Finish" : "Next"}
            </Button>
          </Box>
        </React.Fragment>
      )}
      <Dialog open={openDialog} onClose={() => handleDialogClose(false)}>
        <DialogTitle>{"Existing Report Found"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A report for the selected week already exists. Do you want to edit
            the existing report?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)}>No</Button>
          <Button onClick={() => handleDialogClose(true)} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <CustomAlert
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        handleClose={() => setAlertOpen(false)}
      />
    </Box>
  );
};

const ReviewDataTable = ({ reportData, metrics }: any) => (
  <TableContainer component={Paper}>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Car Count (Mon-Fri)</TableCell>
          <TableCell>{reportData.carCountMonFri}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Car Count (Sat-Sun)</TableCell>
          <TableCell>{reportData.carCountSatSun}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Retail Car Count (Mon-Fri)</TableCell>
          <TableCell>{reportData.retailCarCountMonFri}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Retail Car Count (Sat-Sun)</TableCell>
          <TableCell>{reportData.retailCarCountSatSun}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Total Cars</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.totalCars}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Retail Revenue (Mon-Fri)</TableCell>
          <TableCell>{reportData.retailRevenueMonFri}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Retail Revenue (Sat-Sun)</TableCell>
          <TableCell>{reportData.retailRevenueSatSun}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Total Revenue (Mon-Fri)</TableCell>
          <TableCell>{reportData.totalRevenueMonFri}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Total Revenue (Sat-Sun)</TableCell>
          <TableCell>{reportData.totalRevenueSatSun}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Total Revenue</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.totalRevenue}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Avg. Retail Visit</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.avgRetailVisit.toFixed(2)}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Avg Member Visit</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.avgMemberVisit.toFixed(2)}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Staff Hours (Mon-Fri)</TableCell>
          <TableCell>{reportData.staffHoursMonFri}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Staff Hours (Sat-Sun)</TableCell>
          <TableCell>{reportData.staffHoursSatSun}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Cars Per Labor Hour (Mon-Fri)</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.carsPerLaborHourMonFri.toFixed(2)}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Cars Per Labor Hour (Sat-Sun)</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.carsPerLaborHourSatSun.toFixed(2)}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Total Cars Per Man Hour</strong>
          </TableCell>
          <TableCell>
            <strong>{metrics.totalCarsPerManHour.toFixed(2)}</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Total Club Plans Sold</TableCell>
          <TableCell>{reportData.totalClubPlansSold}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Conversion Rate</strong>
          </TableCell>
          <TableCell>
            <strong>{(metrics.conversionRate * 100).toFixed(2)}%</strong>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Total Club Plan Members</TableCell>
          <TableCell>{reportData.totalClubPlanMembers}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default MultiStepForm;
