const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:10000";

const api = async (endpoint, method = "GET", body = null, headers = {}) => {
  // Check for mobile token fallback
  const mobileToken = localStorage.getItem("mobile_auth_token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(mobileToken && { Authorization: `Bearer ${mobileToken}` }),
      ...headers,
    },
    credentials: "include", // Ensure cookies are sent
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (import.meta.env.MODE === "development") {
    console.log("Fetching:", `${baseURL}${endpoint}`, options); // Debug log
  }
  const response = await fetch(`${baseURL}${endpoint}`, options);

  // Try to parse the response body first
  let result;
  try {
    result = await response.json();
  } catch {
    // If JSON parsing fails, handle as text
    const errorText = await response.text();
    console.error("Fetch error - JSON parse failed:", {
      status: response.status,
      text: errorText,
    });
    throw new Error(`Server error. Please try again later.`);
  }

  // If response is not ok, throw error with the actual message from server
  if (!response.ok) {
    console.error("Fetch error:", {
      status: response.status,
      message: result.message || "Unknown error",
      result: result,
    });

    // Create error with the actual server message
    const error = new Error(
      result.message || "Server error. Please try again later."
    );
    error.status = response.status;
    error.serverResponse = result;
    throw error;
  }

  // Store mobile token if provided in response (for mobile fallback)
  if (result.token && import.meta.env.PROD) {
    localStorage.setItem("mobile_auth_token", result.token);
  }

  return result;
};

// All endpoints (unchanged)
export const endpoints = {
  login: { url: "/api/employees/login", method: "POST" },
  register: { url: "/api/employees/register", method: "POST" },
  getEmployees: { url: "/api/employees", method: "GET" },
  getEmployeeById: { url: "/api/employees/:id", method: "GET" },
  updateEmployee: { url: "/api/employees/:id", method: "PATCH" },
  deleteEmployee: { url: "/api/employees/:id", method: "DELETE" },
  recordAttendance: { url: "/api/attendance", method: "POST" },
  getAttendance: { url: "/api/attendance/employee/:employeeId", method: "GET" },
  generateQrCode: { url: "/api/attendance/qr/:employeeId", method: "GET" },
  scanQrCode: { url: "/api/attendance/scan-qr", method: "POST" },
  facialAttendance: { url: "/api/attendance/facial", method: "POST" },
  recordExit: { url: "/api/attendance/exit", method: "POST" },
  getPresenceReport: {
    url: "/api/attendance/report/:employeeId",
    method: "GET",
  },
  getAllPresenceReports: { url: "/api/attendance/reports", method: "GET" },
  generateAttestation: { url: "/api/documents/attestation", method: "POST" },
  generatePaySlip: { url: "/api/documents/payslip", method: "POST" },
  getEmployeeDocuments: {
    url: "/api/documents/employee/:employeeId",
    method: "GET",
  },
  getAllAttestations: { url: "/api/documents/attestations", method: "GET" },
  getAllDocuments: { url: "/api/documents/all", method: "GET" },
  downloadDocument: { url: "/api/documents/download/:docId", method: "GET" },
  requestLeave: { url: "/api/leaves", method: "POST" },
  approveLeave: { url: "/api/leaves/approve", method: "POST" },
  getEmployeeLeaves: { url: "/api/leaves/employee/:employeeId", method: "GET" },
  getAllLeaves: { url: "/api/leaves", method: "GET" },
};

export default api;
