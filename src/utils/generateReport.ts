import * as XLSX from "xlsx";
import dayjs from "dayjs";

const generateReport = (reports: any, allLocations: any) => {
  const workbook = XLSX.utils.book_new();

  const reportsByWeek = reports.reduce((acc: any, report: any) => {
    const weekEndDate = report.weekEndDate;
    if (!acc[weekEndDate]) acc[weekEndDate] = [];
    acc[weekEndDate].push(report);
    return acc;
  }, {});

  const metricKeyMapping: any = {
    "Car Count Mon - Fri": "carCountMonFri",
    "Car Count Sat - Sun": "carCountSatSun",
    "Retail Car Count Mon - Fri": "retailCarCountMonFri",
    "Retail Car Count Sat - Sun": "retailCarCountSatSun",
    "Total Cars": "totalCars",
    "Retail Revenue Mon - Fri": "retailRevenueMonFri",
    "Retail Revenue Sat - Sun": "retailRevenueSatSun",
    "Total Revenue Mon - Fri": "totalRevenueMonFri",
    "Total Revenue Sat - Sun": "totalRevenueSatSun",
    "Total Revenue": "totalRevenue",
    "Avg. Retail Visit": "avgRetailVisit",
    "Avg. Member Visit": "avgMemberVisit",
    "Staff Hours Mon - Fri": "staffHoursMonFri",
    "Staff Hours Sat - Sun": "staffHoursSatSun",
    "Cars Per Labor Hour Mon - Fri": "carsPerLaborHourMonFri",
    "Cars Per Labor Hour Sat & Sun": "carsPerLaborHourSatSun",
    "Total Cars Per Man Hour": "totalCarsPerManHour",
    "Total Club Plans Sold": "totalClubPlansSold",
    "Conversion Rate": "conversionRate",
    "Total Club Plan Members": "totalClubPlanMembers",
  };

  const roundToTwoDecimalPlaces = (num: number) => {
    return Math.round(num * 100) / 100;
  };

  const calculateMetrics = (report: any) => {
    const carCountMonFri = parseInt(report.carCountMonFri) || 0;
    const carCountSatSun = parseInt(report.carCountSatSun) || 0;
    const retailCarCountMonFri = parseInt(report.retailCarCountMonFri) || 0;
    const retailCarCountSatSun = parseInt(report.retailCarCountSatSun) || 0;
    const retailRevenueMonFri = parseFloat(report.retailRevenueMonFri) || 0;
    const retailRevenueSatSun = parseFloat(report.retailRevenueSatSun) || 0;
    const totalRevenueMonFri = parseFloat(report.totalRevenueMonFri) || 0;
    const totalRevenueSatSun = parseFloat(report.totalRevenueSatSun) || 0;
    const staffHoursMonFri = parseFloat(report.staffHoursMonFri) || 0;
    const staffHoursSatSun = parseFloat(report.staffHoursSatSun) || 0;
    const totalClubPlansSold = parseFloat(report.totalClubPlansSold) || 0;

    const totalCars = carCountMonFri + carCountSatSun;
    const totalRevenue = totalRevenueMonFri + totalRevenueSatSun;
    const totalRetailCarCount = retailCarCountMonFri + retailCarCountSatSun;
    const totalRetailRevenue = retailRevenueMonFri + retailRevenueSatSun;
    const avgRetailVisit = totalRetailCarCount
      ? roundToTwoDecimalPlaces(totalRetailRevenue / totalRetailCarCount)
      : 0;
    const avgMemberVisit =
      totalCars && totalCars - totalRetailCarCount
        ? roundToTwoDecimalPlaces(
            (totalRevenue - totalRetailRevenue) /
              (totalCars - totalRetailCarCount)
          )
        : 0;
    const carsPerLaborHourMonFri = staffHoursMonFri
      ? roundToTwoDecimalPlaces(carCountMonFri / staffHoursMonFri)
      : 0;
    const carsPerLaborHourSatSun = staffHoursSatSun
      ? roundToTwoDecimalPlaces(carCountSatSun / staffHoursSatSun)
      : 0;
    const totalCarsPerManHour =
      staffHoursMonFri + staffHoursSatSun
        ? roundToTwoDecimalPlaces(
            totalCars / (staffHoursMonFri + staffHoursSatSun)
          )
        : 0;
    const conversionRate = totalRetailCarCount
      ? roundToTwoDecimalPlaces(totalClubPlansSold / totalRetailCarCount)
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

  Object.entries(reportsByWeek).forEach(([weekEndDate, weeklyReports]: any) => {
    const endOfWeek = dayjs(weekEndDate).format("M-DD-YY");
    const sheetName = endOfWeek;
    const sheetData: any[] = [];

    const firstRow = [
      `Week Ending ${dayjs(weekEndDate).format("MMMM D, YYYY")}`,
    ];
    sheetData.push(firstRow);

    const secondRow = ["", "Totals", "ILL", "GA / SC"];
    const locationNames: any = allLocations
      .sort((a: any, b: any) => a.state.localeCompare(b.state))
      .map((location: any) => location.name);
    secondRow.push(...locationNames);
    sheetData.push(secondRow);

    const metricsLabels = Object.keys(metricKeyMapping);

    const locationMetrics = locationNames.reduce((acc: any, loc: any) => {
      acc[loc] = metricsLabels.reduce((metricsAcc: any, label: string) => {
        const metricKey = metricKeyMapping[label];
        metricsAcc[metricKey] = 0;
        return metricsAcc;
      }, {});
      return acc;
    }, {});

    const stateMetrics = {
      ILL: { ...locationMetrics[locationNames[0]] },
      GA: { ...locationMetrics[locationNames[0]] },
      Totals: { ...locationMetrics[locationNames[0]] },
    };

    weeklyReports.forEach((report: any) => {
      const locName = report.location.name;
      const locState = report.location.state;
      const locMetrics = locationMetrics[locName];

      Object.keys(metricKeyMapping).forEach((label) => {
        const metricKey = metricKeyMapping[label];
        const calculatedMetrics: any = calculateMetrics(report);
        locMetrics[metricKey] =
          calculatedMetrics[metricKey] || report[metricKey];
      });

      if (locState === "ILL") {
        Object.keys(stateMetrics.ILL).forEach((key) => {
          stateMetrics.ILL[key] += locMetrics[key];
        });
      } else if (locState === "GA") {
        Object.keys(stateMetrics.GA).forEach((key) => {
          stateMetrics.GA[key] += locMetrics[key];
        });
      }

      Object.keys(stateMetrics.Totals).forEach((key) => {
        stateMetrics.Totals[key] += locMetrics[key];
      });
    });

    metricsLabels.forEach((label) => {
      const row = [label];
      const metricKey = metricKeyMapping[label];
      const addCell = (value: any) => {
        if (isNaN(value)) {
          row.push("");
        } else {
          row.push(value);
        }
      };

      addCell(stateMetrics.Totals[metricKey]);
      addCell(stateMetrics.ILL[metricKey]);
      addCell(stateMetrics.GA[metricKey]);

      locationNames.forEach((location: any) => {
        addCell(locationMetrics[location][metricKey]);
      });

      sheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    const wscols = [
      { wch: 40 }, // First column width
      { wch: 10 }, // Totals
      { wch: 10 }, // ILL
      { wch: 10 }, // GA / SC
      ...locationNames.map((loc: any) => ({ wch: Math.max(loc.length, 15) })), // Location columns
    ];
    worksheet["!cols"] = wscols;

    for (let i = 0; i <= 1; i++) {
      const row = sheetData[i];
      row.forEach((cell: any, index: any) => {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: index });
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = { font: { bold: true } };
      });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  return buffer;
};

export default generateReport;
