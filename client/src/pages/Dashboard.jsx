import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import UserContext from "../context/UserContext";
import api from "../utils/api";
import Loading from "../components/Loading";
import {
  FaUsers,
  FaClock,
  FaCalendarCheck,
  FaFileAlt,
  FaChartLine,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaCheckCircle,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardWrapper = styled.div`
  display: flex;
  margin-left: 250px;
  min-height: 100vh;
  padding: 0px 40px 30px 40px;
  background: linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%);

  @media (max-width: 768px) {
    margin-left: 0;
    padding: 20px;
    justify-content: center;
  }

  @media (max-width: 480px) {
    padding: 15px;
    justify-content: center;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 24px 0;
  max-width: 1400px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 16px 0;
    max-width: 100%;
    margin: 0 auto;
  }

  @media (max-width: 480px) {
    padding: 12px 0;
    max-width: 100%;
    margin: 0 auto;
  }
`;

const WelcomeSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 28px 32px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
  border-left: 4px solid #f7a012;

  @media (max-width: 768px) {
    padding: 24px;
    margin-bottom: 20px;
  }
`;

const WelcomeTitle = styled.h1`
  margin: 0 0 6px 0;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const WelcomeSubtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.95;
  font-weight: 300;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 28px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid ${(props) => props.$color || "#f7a012"};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: ${(props) => props.$color || "#f7a012"};
    opacity: 0.05;
    border-radius: 50%;
    transform: translate(30px, -30px);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-left-width: 4px;
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: ${(props) => props.$color || "#f7a012"};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  box-shadow: 0 4px 14px
    ${(props) =>
      props.$color ? `${props.$color}35` : "rgba(247, 160, 18, 0.25)"};
`;

const StatValue = styled.div`
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 1.875rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  background: ${(props) => (props.$positive ? "#10b98112" : "#ef444412")};
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;

  svg {
    font-size: 0.65rem;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 30px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ChartCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RecentActivitiesCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  max-height: 480px;
  overflow-y: auto;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: #f9fafb;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;

    &:hover {
      background: #9ca3af;
    }
  }
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s ease;

  &:hover {
    background: #f9fafb;
    margin: 0 -12px;
    padding: 12px;
    border-radius: 8px;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${(props) => props.$color || "#f3f4f6"};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  font-size: 0.875rem;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const QuickActionCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    border-color: #f7a012;
  }
`;

const QuickActionIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f7a012 0%, #e07b00 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin: 0 auto 10px auto;
  box-shadow: 0 4px 12px rgba(247, 160, 18, 0.25);
  transition: all 0.3s ease;
`;

const QuickActionText = styled.div`
  font-size: 0.8125rem;
  color: #374151;
  font-weight: 600;
  font-weight: 500;
`;

const Dashboard = () => {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalAttendance: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalAttestations: 0,
    totalPayslips: 0,
    recentActivities: [],
    trends: {
      employeesTrend: 0,
      attendanceTrend: 0,
      pendingLeavesTrend: 0,
      approvedLeavesTrend: 0,
      attestationsTrend: 0,
      payslipsTrend: 0,
    },
  });
  const [chartData, setChartData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const handleMenuToggle = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/attendance");
    }
  }, [user, loading, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== "admin") return;

      setLoadingData(true);
      try {
        // Fetch all data in parallel
        const [
          employeesResponse,
          attendanceCountResponse,
          dailyStatsResponse,
          leavesResponse,
          documentsResponse,
        ] = await Promise.all([
          api("/api/employees", "GET"),
          api("/api/attendance/total-count", "GET"),
          api("/api/attendance/daily-stats?days=60", "GET"), // Fetch 60 days for trend calculations
          api("/api/leaves", "GET"),
          api("/api/documents/all", "GET"),
        ]);

        const employees = employeesResponse.data?.employees || [];
        const totalAttendanceCount =
          attendanceCountResponse.data?.totalCount || 0;
        const dailyStats = dailyStatsResponse.data?.stats || [];
        const leaves = leavesResponse.data?.leaves || [];

        // Documents response is an array directly (not wrapped in .data)
        const documents = Array.isArray(documentsResponse)
          ? documentsResponse
          : [];

        // Separate documents by type
        const attestations = documents.filter(
          (doc) => doc.type === "attestation"
        );
        const payslips = documents.filter((doc) => doc.type === "payslip");

        // Calculate trends by comparing with last month's data
        const calculateTrends = () => {
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          const currentMonthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

          // Calculate new employees hired this month vs last month
          const lastMonthNewHires = employees.filter((emp) => {
            const hireDate = new Date(emp.hireDate || emp.createdAt);
            return hireDate >= lastMonth && hireDate <= lastMonthEnd;
          }).length;

          const currentMonthNewHires = employees.filter((emp) => {
            const hireDate = new Date(emp.hireDate || emp.createdAt);
            return hireDate >= currentMonthStart;
          }).length;

          // Calculate last month's attendance
          const lastMonthAttendance = dailyStats
            .filter((stat) => {
              const statDate = new Date(stat.date);
              return statDate >= lastMonth && statDate <= lastMonthEnd;
            })
            .reduce((sum, stat) => sum + stat.count, 0);

          // Calculate last month's leaves
          const lastMonthPendingLeaves = leaves.filter((leave) => {
            const leaveDate = new Date(leave.createdAt || leave.startDate);
            return (
              leaveDate >= lastMonth &&
              leaveDate <= lastMonthEnd &&
              leave.status === "pending"
            );
          }).length;

          const lastMonthApprovedLeaves = leaves.filter((leave) => {
            const leaveDate = new Date(leave.createdAt || leave.startDate);
            return (
              leaveDate >= lastMonth &&
              leaveDate <= lastMonthEnd &&
              leave.status === "approved"
            );
          }).length;

          // Calculate last month's documents
          const lastMonthAttestations = attestations.filter((doc) => {
            const docDate = new Date(doc.generatedDate || doc.createdAt);
            return docDate >= lastMonth && docDate <= lastMonthEnd;
          }).length;

          const lastMonthPayslips = payslips.filter((doc) => {
            const docDate = new Date(doc.generatedDate || doc.createdAt);
            return docDate >= lastMonth && docDate <= lastMonthEnd;
          }).length;

          // Calculate percentage changes
          const calcPercentChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
          };

          // Current month's attendance data
          const currentMonthAttendance = dailyStats
            .filter((stat) => {
              const statDate = new Date(stat.date);
              return statDate >= currentMonthStart;
            })
            .reduce((sum, stat) => sum + stat.count, 0);

          const currentMonthPendingLeaves = leaves.filter((leave) => {
            const leaveDate = new Date(leave.createdAt || leave.startDate);
            return leaveDate >= currentMonthStart && leave.status === "pending";
          }).length;

          const currentMonthApprovedLeaves = leaves.filter((leave) => {
            const leaveDate = new Date(leave.createdAt || leave.startDate);
            return (
              leaveDate >= currentMonthStart && leave.status === "approved"
            );
          }).length;

          const currentMonthAttestations = attestations.filter((doc) => {
            const docDate = new Date(doc.generatedDate || doc.createdAt);
            return docDate >= currentMonthStart;
          }).length;

          const currentMonthPayslips = payslips.filter((doc) => {
            const docDate = new Date(doc.generatedDate || doc.createdAt);
            return docDate >= currentMonthStart;
          }).length;

          // Debug logging
          console.log("Trend Calculations:", {
            employees: {
              current: currentMonthNewHires,
              last: lastMonthNewHires,
              trend: calcPercentChange(currentMonthNewHires, lastMonthNewHires),
            },
            attendance: {
              current: currentMonthAttendance,
              last: lastMonthAttendance,
              trend: calcPercentChange(
                currentMonthAttendance,
                lastMonthAttendance
              ),
            },
            pendingLeaves: {
              current: currentMonthPendingLeaves,
              last: lastMonthPendingLeaves,
              trend: calcPercentChange(
                currentMonthPendingLeaves,
                lastMonthPendingLeaves
              ),
            },
            approvedLeaves: {
              current: currentMonthApprovedLeaves,
              last: lastMonthApprovedLeaves,
              trend: calcPercentChange(
                currentMonthApprovedLeaves,
                lastMonthApprovedLeaves
              ),
            },
            attestations: {
              current: currentMonthAttestations,
              last: lastMonthAttestations,
              trend: calcPercentChange(
                currentMonthAttestations,
                lastMonthAttestations
              ),
            },
            payslips: {
              current: currentMonthPayslips,
              last: lastMonthPayslips,
              trend: calcPercentChange(currentMonthPayslips, lastMonthPayslips),
            },
          });

          return {
            employeesTrend: calcPercentChange(
              currentMonthNewHires,
              lastMonthNewHires
            ), // Compare new hires this month vs last month
            attendanceTrend: calcPercentChange(
              currentMonthAttendance,
              lastMonthAttendance
            ),
            pendingLeavesTrend: calcPercentChange(
              currentMonthPendingLeaves,
              lastMonthPendingLeaves
            ),
            approvedLeavesTrend: calcPercentChange(
              currentMonthApprovedLeaves,
              lastMonthApprovedLeaves
            ),
            attestationsTrend: calcPercentChange(
              currentMonthAttestations,
              lastMonthAttestations
            ),
            payslipsTrend: calcPercentChange(
              currentMonthPayslips,
              lastMonthPayslips
            ),
          };
        };

        const trends = calculateTrends();

        // Process REAL attendance data for chart (last 7 days only for chart display)
        const processAttendanceChart = () => {
          // Use only the last 7 days for the chart
          const last7Days = dailyStats.slice(-7);

          const labels = last7Days.map((stat) => {
            const date = new Date(stat.date);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          });

          const counts = last7Days.map((stat) => stat.count);

          setChartData({
            labels: labels,
            datasets: [
              {
                label: "Employees Present",
                data: counts,
                fill: true,
                backgroundColor: "rgba(247, 160, 18, 0.1)",
                borderColor: "#f7a012",
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: "#f7a012",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
            ],
          });
        };

        processAttendanceChart();

        // Build real recent activities from actual data
        const recentActivities = [];

        // Add recent leave requests (last 4) - these come populated from backend
        const recentLeaves = leaves
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.startDate) -
              new Date(a.createdAt || a.startDate)
          )
          .slice(0, 4);

        recentLeaves.forEach((leave, index) => {
          // Leave comes with populated employee object from backend
          const employeeName = leave.employee?.name || "Unknown Employee";

          recentActivities.push({
            id: `leave-${index}`,
            type: "leave",
            text: `${
              leave.status === "pending"
                ? "New"
                : leave.status.charAt(0).toUpperCase() + leave.status.slice(1)
            } leave request from ${employeeName}`,
            time: new Date(
              leave.createdAt || leave.startDate
            ).toLocaleDateString(),
            icon: FaCalendarCheck,
            color:
              leave.status === "pending"
                ? "#f59e0b"
                : leave.status === "approved"
                ? "#10b981"
                : "#ef4444",
          });
        });

        // If no activities, show a placeholder
        if (recentActivities.length === 0) {
          recentActivities.push({
            id: "placeholder",
            type: "info",
            text: "No recent activities to display",
            time: "Start using the system to see activities here",
            icon: FaEye,
            color: "#9ca3af",
          });
        }

        setDashboardData({
          totalEmployees: employees.length,
          totalAttendance: totalAttendanceCount,
          pendingLeaves: leaves.filter((leave) => leave.status === "pending")
            .length,
          approvedLeaves: leaves.filter((leave) => leave.status === "approved")
            .length,
          totalAttestations: attestations.length,
          totalPayslips: payslips.length,
          recentActivities: recentActivities,
          trends: trends,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper function to render trend text
  const renderTrend = (trend) => {
    if (trend === 0) return "No change from last month";
    const isPositive = trend > 0;
    const Arrow = isPositive ? FaArrowUp : FaArrowDown;
    return (
      <>
        <Arrow />
        {isPositive ? "+" : ""}
        {trend}% from last month
      </>
    );
  };

  // Show loading while checking permissions or data
  if (loading || !user || user.role !== "admin" || loadingData) {
    return <Loading text="Loading..." />;
  }

  return (
    <>
      <Navbar onMenuToggle={handleMenuToggle} />
      <DashboardWrapper>
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        <Content>
          {/* Welcome Section */}
          <WelcomeSection>
            <WelcomeTitle>Welcome back, Admin!</WelcomeTitle>
            <WelcomeSubtitle>
              Here's what's happening in your HR system today.
            </WelcomeSubtitle>
          </WelcomeSection>

          {/* Statistics Cards */}
          <StatsGrid>
            <StatCard $color="#10b981">
              <StatHeader>
                <StatIcon $color="#10b981">
                  <FaUsers />
                </StatIcon>
              </StatHeader>
              <StatValue>{dashboardData.totalEmployees}</StatValue>
              <StatLabel>Total Employees</StatLabel>
              <StatChange $positive={dashboardData.trends.employeesTrend >= 0}>
                {renderTrend(dashboardData.trends.employeesTrend)}
              </StatChange>
            </StatCard>

            <StatCard $color="#3b82f6">
              <StatHeader>
                <StatIcon $color="#3b82f6">
                  <FaClock />
                </StatIcon>
              </StatHeader>
              <StatValue>{dashboardData.totalAttendance}</StatValue>
              <StatLabel>Attendance Records</StatLabel>
              <StatChange $positive={dashboardData.trends.attendanceTrend >= 0}>
                {renderTrend(dashboardData.trends.attendanceTrend)}
              </StatChange>
            </StatCard>

            <StatCard $color="#f59e0b">
              <StatHeader>
                <StatIcon $color="#f59e0b">
                  <FaCalendarCheck />
                </StatIcon>
              </StatHeader>
              <StatValue>{dashboardData.pendingLeaves}</StatValue>
              <StatLabel>Pending Leaves</StatLabel>
              <StatChange
                $positive={dashboardData.trends.pendingLeavesTrend <= 0}
              >
                {renderTrend(dashboardData.trends.pendingLeavesTrend)}
              </StatChange>
            </StatCard>

            <StatCard $color="#10b981">
              <StatHeader>
                <StatIcon $color="#10b981">
                  <FaCheckCircle />
                </StatIcon>
              </StatHeader>
              <StatValue>{dashboardData.approvedLeaves}</StatValue>
              <StatLabel>Approved Leaves</StatLabel>
              <StatChange
                $positive={dashboardData.trends.approvedLeavesTrend >= 0}
              >
                {renderTrend(dashboardData.trends.approvedLeavesTrend)}
              </StatChange>
            </StatCard>

            <StatCard $color="#8b5cf6">
              <StatHeader>
                <StatIcon $color="#8b5cf6">
                  <FaFileAlt />
                </StatIcon>
              </StatHeader>
              <StatValue>{dashboardData.totalAttestations}</StatValue>
              <StatLabel>Attestations</StatLabel>
              <StatChange
                $positive={dashboardData.trends.attestationsTrend >= 0}
              >
                {renderTrend(dashboardData.trends.attestationsTrend)}
              </StatChange>
            </StatCard>

            <StatCard $color="#ec4899">
              <StatHeader>
                <StatIcon $color="#ec4899">
                  <FaFileAlt />
                </StatIcon>
              </StatHeader>
              <StatValue>{dashboardData.totalPayslips}</StatValue>
              <StatLabel>Payslips</StatLabel>
              <StatChange $positive={dashboardData.trends.payslipsTrend >= 0}>
                {renderTrend(dashboardData.trends.payslipsTrend)}
              </StatChange>
            </StatCard>
          </StatsGrid>

          {/* Dashboard Grid */}
          <DashboardGrid>
            <ChartCard>
              <ChartTitle>
                <FaChartLine />
                Attendance Overview (Last 7 Days)
              </ChartTitle>
              <div style={{ height: "280px", position: "relative" }}>
                {chartData ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            color: "#1f2937",
                            font: {
                              size: 12,
                              weight: 500,
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          padding: 12,
                          titleColor: "#fff",
                          bodyColor: "#fff",
                          borderColor: "#f7a012",
                          borderWidth: 1,
                          titleFont: {
                            size: 14,
                            weight: 600,
                          },
                          bodyFont: {
                            size: 13,
                          },
                          callbacks: {
                            label: function (context) {
                              return `Employees: ${context.parsed.y}`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          suggestedMax:
                            Math.max(...chartData.datasets[0].data, 10) + 5,
                          ticks: {
                            precision: 0,
                            maxTicksLimit: 8,
                            color: "#6b7280",
                            font: {
                              size: 11,
                            },
                            callback: function (value) {
                              if (Number.isInteger(value)) {
                                return value;
                              }
                            },
                          },
                          grid: {
                            color: "rgba(0, 0, 0, 0.05)",
                            drawBorder: false,
                          },
                          title: {
                            display: true,
                            text: "Number of Employees",
                            color: "#6b7280",
                            font: {
                              size: 12,
                              weight: 600,
                            },
                          },
                        },
                        x: {
                          ticks: {
                            color: "#6b7280",
                            font: {
                              size: 11,
                            },
                          },
                          grid: {
                            display: false,
                          },
                          title: {
                            display: true,
                            text: "Date",
                            color: "#6b7280",
                            font: {
                              size: 12,
                              weight: 600,
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                    }}
                  >
                    Loading chart data...
                  </div>
                )}
              </div>
            </ChartCard>

            <RecentActivitiesCard>
              <ChartTitle>
                <FaEye />
                Recent Activities
              </ChartTitle>
              {dashboardData.recentActivities.map((activity) => (
                <ActivityItem key={activity.id}>
                  <ActivityIcon $color={activity.color}>
                    <activity.icon />
                  </ActivityIcon>
                  <ActivityContent>
                    <ActivityText>{activity.text}</ActivityText>
                    <ActivityTime>{activity.time}</ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              ))}
            </RecentActivitiesCard>
          </DashboardGrid>

          {/* Quick Actions */}
          <div>
            <ChartTitle style={{ marginBottom: "16px" }}>
              <FaChartLine />
              Quick Actions
            </ChartTitle>
            <QuickActionsGrid>
              <QuickActionCard onClick={() => navigate("/profile")}>
                <QuickActionIcon>
                  <FaUsers />
                </QuickActionIcon>
                <QuickActionText>Manage Employees</QuickActionText>
              </QuickActionCard>
              <QuickActionCard onClick={() => navigate("/attendance")}>
                <QuickActionIcon>
                  <FaClock />
                </QuickActionIcon>
                <QuickActionText>View Attendance</QuickActionText>
              </QuickActionCard>
              <QuickActionCard onClick={() => navigate("/leaves")}>
                <QuickActionIcon>
                  <FaCalendarCheck />
                </QuickActionIcon>
                <QuickActionText>Review Leaves</QuickActionText>
              </QuickActionCard>
              <QuickActionCard onClick={() => navigate("/documents")}>
                <QuickActionIcon>
                  <FaFileAlt />
                </QuickActionIcon>
                <QuickActionText>Generate Documents</QuickActionText>
              </QuickActionCard>
            </QuickActionsGrid>
          </div>
        </Content>
      </DashboardWrapper>
    </>
  );
};

export default Dashboard;






