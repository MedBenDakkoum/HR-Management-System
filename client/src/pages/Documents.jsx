import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import UserContext from "../context/UserContext";
import Popup from "../components/Popup";
import Loading from "../components/Loading";
// NOTE: import helpers using lowercase to match filename 'helpers.js'
import { formatDate } from "../utils/Helpers.js";
import {
  FaFileAlt,
  FaSearch,
  FaDownload,
  FaTrash,
  FaFileInvoiceDollar,
  FaFileContract,
} from "react-icons/fa";

// Define colors to match your styling
const colors = {
  text: "#1f2937",
  accent: "#f18500",
  tertialy: "#e07b00",
  secondary: "#9ca3af",
  background: "#f5f7fa",
};

// Styled Components (consistent with Leaves.jsx)
const DocumentsWrapper = styled.div`
  display: flex;
  margin-left: 250px;
  margin-top: 40px;
  padding: 20px 60px 40px 60px;
  min-height: calc(100vh - 70px);
  background: ${colors.background};

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 20px;
    padding: 15px;
    justify-content: center;
  }

  @media (max-width: 480px) {
    margin-top: 15px;
    padding: 10px;
    justify-content: center;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  width: 100%;

  @media (max-width: 768px) {
    max-width: 100%;
    align-items: center;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
  overflow: visible;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    align-items: flex-start;
  }

  @media (max-width: 480px) {
    padding: 15px;
    gap: 15px;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${colors.accent};
  color: white;

  &:hover:not(:disabled) {
    background: ${colors.tertialy};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
  overflow: visible;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
`;

const SearchInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: auto;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SearchBox = styled.input`
  padding: 12px 16px 12px 44px;
  border: 2px solid ${colors.secondary};
  border-radius: 8px;
  font-size: 0.95rem;
  width: 300px;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${colors.accent};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 16px;
  color: ${colors.secondary};
  pointer-events: none;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${colors.secondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.text};
`;

const FormInput = styled.input`
  padding: 12px 16px;
  border: 2px solid ${colors.secondary};
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${colors.accent};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.1);
  }
`;

const SelectStyled = styled.select`
  padding: 12px 16px;
  border: 2px solid ${colors.secondary};
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${colors.accent};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.1);
  }
`;

const ModalFooter = styled.div`
  padding: 24px 32px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;

  &.cancel {
    background: transparent;
    color: ${colors.secondary};
    border: 2px solid ${colors.secondary};
  }

  &.submit {
    background: ${colors.accent};
    color: white;
  }

  &.submit:hover:not(:disabled) {
    background: ${colors.tertialy};
    transform: translateY(-1px);
  }

  &.cancel:hover {
    background: ${colors.background};
    color: ${colors.text};
  }

  &:disabled {
    background: #d1d5db;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const DocumentsTable = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    align-self: center;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1.5fr;
  gap: 1px;
  background: ${colors.background};
  padding: 16px 24px;
  font-weight: 600;
  color: ${colors.text};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr 1fr;
    padding: 12px 16px;
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    padding: 10px 12px;
    font-size: 0.75rem;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1.5fr;
  gap: 1px;
  padding: 16px 24px;
  background: white;
  transition: all 0.2s ease;

  &:nth-child(even) {
    background: #f9fafb;
  }

  &:hover {
    background: ${colors.background};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr 1fr;
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    padding: 10px 12px;
  }
`;

const TableCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 0.9rem;
`;

const DocumentType = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${(props) =>
    props.type === "attestation" ? "#d1fae5" : "#dbeafe"};
  color: ${(props) => (props.type === "attestation" ? "#059669" : "#2563eb")};
`;

const ActionButtonStyled = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.download {
    background: #d1fae5;
    color: #059669;
  }

  &.delete {
    background: #fee2e2;
    color: #dc2626;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const NoData = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: ${colors.secondary};
`;

const NoDataIcon = styled(FaFileAlt)`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const Documents = () => {
  console.log("🚀 Documents component loaded/rendered");
  
  const { user } = useContext(UserContext);
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  console.log("📊 Current employees state:", employees);
  const [loading, setLoading] = useState(true);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupMessage, setPopupMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Attestation form state
  const [attestationForm, setAttestationForm] = useState({
    employeeId: undefined,
    legalInfo: "FLESK Consulting, 123 Business St, Monastir, Moknine",
  });

  // Payslip form state
  const [payslipForm, setPayslipForm] = useState({
    employeeId: "",
    month: "",
    year: new Date().getFullYear().toString(),
    salary: "",
    deductions: "",
    bonuses: "",
  });

  const showPopupSafe = (type, message, autoClose = true) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
    if (autoClose) setTimeout(() => setPopupVisible(false), 3000);
  };

  // Fetch documents and employees
  const fetchData = async () => {
    console.log("🔥 fetchData called, user:", user);
    console.log("🔥 User role:", user?.role);
    console.log("🔥 Is admin?", user?.role === "admin");
    
    setLoading(true);
    
    // For admin users, fetch employees FIRST (separate from documents)
    if (user?.role === "admin") {
      console.log("✅ Admin confirmed, fetching employees first...");
      
      // Fetch employees (independent of documents)
      try {
        console.log("📋 Fetching employees list...");
        const employeesResponse = await api("/api/employees", "GET");
        console.log("📥 Raw employees response:", employeesResponse);
        console.log("📥 Response type:", typeof employeesResponse);
        console.log("📥 Response data:", employeesResponse?.data);
        console.log("📥 Response data employees:", employeesResponse?.data?.employees);
        
        const employeesList = employeesResponse?.data?.employees || [];
        console.log("👥 Employees list extracted:", employeesList);
        console.log("👥 Number of employees:", employeesList.length);
        
        if (employeesList.length > 0) {
          console.log("✅ First employee:", employeesList[0]);
          console.log("✅ Employee has id?", employeesList[0].id);
          console.log("✅ Employee has _id?", employeesList[0]._id);
          console.log("✅ Employee has name?", employeesList[0].name);
        } else {
          console.warn("⚠️ Employee list is EMPTY! Check Firestore database.");
        }
        
        setEmployees(employeesList);
      } catch (empError) {
        console.error("❌ Error fetching employees:", empError);
        console.error("❌ Error details:", empError.message, empError.stack);
        showPopupSafe("error", "Failed to load employees list");
        setEmployees([]);
      }
    }
    
    // Now fetch documents (separate try-catch so it doesn't block employees)
    try {
      let docsResponse;
      if (user?.role === "admin") {
        console.log("📄 Now fetching documents...");
        docsResponse = await api("/api/documents/all", "GET");
      } else {
        console.log("ℹ️ Not admin, fetching only user's documents");
        docsResponse = await api(`/api/documents/employee/${user?.id}`, "GET");
      }

      // Normalize response shapes: api() might return { data: [...] } or [...]
      if (!docsResponse) {
        setDocuments([]);
      } else if (Array.isArray(docsResponse)) {
        setDocuments(docsResponse);
      } else if (Array.isArray(docsResponse.data)) {
        setDocuments(docsResponse.data);
      } else if (Array.isArray(docsResponse.data?.documents)) {
        setDocuments(docsResponse.data.documents);
      } else {
        // fallback: try to find an array in response
        const maybeArray =
          docsResponse.data?.documents ||
          docsResponse.data?.items ||
          docsResponse.data;
        setDocuments(Array.isArray(maybeArray) ? maybeArray : []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      showPopupSafe("error", "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect triggered, user:", user);
    // wait for user to be available
    if (user && user.id) {
      console.log("👤 User available, ID:", user.id, "Role:", user.role);
      // set default attestation employeeId for non-admins
      if (user.role !== "admin") {
        setAttestationForm((prev) => ({ ...prev, employeeId: user.id }));
      }
      fetchData();
    } else {
      console.log("⏳ Waiting for user...");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle attestation generation
  const handleGenerateAttestation = async (e) => {
    e.preventDefault();
    if (!attestationForm.employeeId || !attestationForm.legalInfo?.trim()) {
      showPopupSafe("error", "Please fill all required fields");
      return;
    }

    try {
      const response = await api("/api/documents/attestation", "POST", {
        employeeId: attestationForm.employeeId,
        legalInfo: attestationForm.legalInfo.trim(),
      });

      if (
        response?.message === "Attestation generated successfully" ||
        response?.success
      ) {
        setShowAttestationModal(false);
        setAttestationForm({
          employeeId: user?.role !== "admin" ? user?.id : "",
          legalInfo: "FLESK Consulting, 123 Business St, Monastir, Moknine",
        });
        fetchData();
        showPopupSafe("success", "Attestation generated successfully");
      } else {
        showPopupSafe(
          "error",
          response?.message || "Failed to generate attestation"
        );
      }
    } catch (error) {
      console.error("Error generating attestation:", error);
      showPopupSafe(
        "error",
        error?.message || "Failed to generate attestation"
      );
    }
  };

  // Handle payslip generation
  const handleGeneratePayslip = async (e) => {
    e.preventDefault();
    if (
      !payslipForm.employeeId ||
      !payslipForm.month ||
      !payslipForm.year ||
      !payslipForm.salary ||
      parseFloat(payslipForm.salary) <= 0
    ) {
      showPopupSafe(
        "error",
        "Please fill all required fields with valid values"
      );
      return;
    }

    try {
      const response = await api("/api/documents/payslip", "POST", {
        employeeId: payslipForm.employeeId,
        month: payslipForm.month,
        year: parseInt(payslipForm.year, 10),
        salary: parseFloat(payslipForm.salary),
        deductions: parseFloat(payslipForm.deductions) || 0,
        bonuses: parseFloat(payslipForm.bonuses) || 0,
      });

      if (
        response?.message === "Pay slip generated successfully" ||
        response?.success
      ) {
        setShowPayslipModal(false);
        setPayslipForm({
          employeeId: "",
          month: "",
          year: new Date().getFullYear().toString(),
          salary: "",
          deductions: "",
          bonuses: "",
        });
        fetchData();
        showPopupSafe("success", "Pay slip generated successfully");
      } else {
        showPopupSafe(
          "error",
          response?.message || "Failed to generate payslip"
        );
      }
    } catch (error) {
      console.error("Error generating payslip:", error);
      showPopupSafe("error", error?.message || "Failed to generate payslip");
    }
  };

  // Handle document download
  const handleDownloadDocument = async (docId, docType) => {
    try {
      const base =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:10000";
      const downloadUrl = `${base}/api/documents/download/${docId}`;

      // iOS Safari and some Android browsers don't support programmatic blob downloads.
      // Prefer native download via opening the URL when the 'download' attribute is unsupported.
      const anchorSupportsDownload =
        typeof HTMLAnchorElement !== "undefined" &&
        "download" in HTMLAnchorElement.prototype;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      if (!anchorSupportsDownload || isIOS || isMobile) {
        // Let the browser handle the stream directly, which honors Content-Disposition
        const opened = window.open(downloadUrl, "_blank");
        if (!opened) {
          // Fallback in case popups are blocked
          window.location.href = downloadUrl;
        }
        showPopupSafe("success", "Document download started");
        return;
      }

      // Desktop path: use blob for consistent file naming
      const response = await fetch(downloadUrl, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docType || "document"}-${docId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showPopupSafe("success", "Document download initiated");
    } catch (error) {
      console.error("Error downloading document:", error);
      showPopupSafe("error", error?.message || "Failed to download document");
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await api(`/api/documents/delete/${docId}`, "DELETE");
      if (
        response?.message === "Document deleted successfully" ||
        response?.success
      ) {
        fetchData();
        showPopupSafe("success", "Document deleted successfully");
      } else {
        showPopupSafe(
          "error",
          response?.message || "Failed to delete document"
        );
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      showPopupSafe("error", error?.message || "Failed to delete document");
    }
  };

  // Filter documents (safe guards)
  const filteredDocuments = (documents || []).filter((doc) => {
    const nameMatch = doc.employee?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const typeMatch = doc.type
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return (nameMatch || typeMatch) && !!doc.employee;
  });

  const handleMenuToggle = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (loading || !user) {
    return (
      <>
        <Navbar onMenuToggle={handleMenuToggle} />
        <DocumentsWrapper>
          <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
          <Content>
            <Loading text="Loading documents..." />
          </Content>
        </DocumentsWrapper>
      </>
    );
  }

  return (
    <>
      <Navbar onMenuToggle={handleMenuToggle} />
      <DocumentsWrapper>
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        <Content>
          {/* Header */}
          <Header>
            <PageTitle>
              <FaFileAlt />
              Document Management
            </PageTitle>
            <Controls>
              {(user.role === "employee" || user.role === "stagiaire") && (
                <ActionButton
                  type="button"
                  onClick={() => {
                    setAttestationForm((prev) => ({
                      ...prev,
                      employeeId: user.id,
                    }));
                    setShowAttestationModal(true);
                  }}
                >
                  <FaFileContract />
                  Generate Attestation
                </ActionButton>
              )}
              {user.role === "admin" && (
                <>
                  <ActionButton
                    type="button"
                    onClick={() => setShowAttestationModal(true)}
                  >
                    <FaFileContract />
                    Generate Attestation
                  </ActionButton>
                  <ActionButton
                    type="button"
                    onClick={() => setShowPayslipModal(true)}
                  >
                    <FaFileInvoiceDollar />
                    Generate Payslip
                  </ActionButton>
                  <SearchInput>
                    <SearchIcon />
                    <SearchBox
                      type="text"
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </SearchInput>
                </>
              )}
            </Controls>
          </Header>

          {/* Documents Table */}
          <DocumentsTable>
            <TableHeader>
              <div>Employee</div>
              <div>Type</div>
              <div>Generated Date</div>
              <div>Legal Info</div>
              <div>Actions</div>
            </TableHeader>

            {filteredDocuments.length === 0 ? (
              <NoData>
                <NoDataIcon />
                <h3>No Documents</h3>
                <p>
                  {user.role === "admin"
                    ? "No documents found. Generate attestations or payslips for employees."
                    : "No documents found. Generate an attestation to get started."}
                </p>
                {(user.role === "employee" || user.role === "stagiaire") && (
                  <ActionButton
                    type="button"
                    onClick={() => {
                      setAttestationForm((prev) => ({
                        ...prev,
                        employeeId: user.id,
                      }));
                      setShowAttestationModal(true);
                    }}
                    style={{ marginTop: "16px" }}
                  >
                    <FaFileContract />
                    Generate Attestation
                  </ActionButton>
                )}
              </NoData>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>{doc.employee?.name || "N/A"}</TableCell>
                  <TableCell>
                    <DocumentType type={doc.type}>
                      {doc.type === "attestation" ? "Attestation" : "Payslip"}
                    </DocumentType>
                  </TableCell>
                  <TableCell>{formatDate(doc.generatedDate)}</TableCell>
                  <TableCell>{doc.legalInfo || "N/A"}</TableCell>
                  <TableCell>
                    <ActionButtonStyled
                      className="download"
                      type="button"
                      onClick={() => handleDownloadDocument(doc._id, doc.type)}
                    >
                      <FaDownload />
                      Download
                    </ActionButtonStyled>
                    {user.role === "admin" && (
                      <ActionButtonStyled
                        className="delete"
                        type="button"
                        onClick={() => handleDeleteDocument(doc._id)}
                      >
                        <FaTrash />
                        Delete
                      </ActionButtonStyled>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </DocumentsTable>
        </Content>
      </DocumentsWrapper>

      {/* Attestation Modal */}
      {showAttestationModal && (
        <ModalOverlay onClick={() => setShowAttestationModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Generate Attestation</ModalTitle>
              <CloseButton onClick={() => setShowAttestationModal(false)}>
                &times;
              </CloseButton>
            </ModalHeader>
            <form onSubmit={handleGenerateAttestation}>
              <ModalBody>
                {user.role === "admin" && (
                  <FormGroup>
                    <FormLabel htmlFor="employeeId">Employee *</FormLabel>
                    <SelectStyled
                      id="employeeId"
                      value={attestationForm.employeeId || ""}
                      onChange={(e) =>
                        setAttestationForm({
                          ...attestationForm,
                          employeeId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select an employee</option>
                      {employees && employees.length > 0 ? (
                        employees.map((emp) => (
                          <option key={emp.id || emp._id} value={emp.id || emp._id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No employees available</option>
                      )}
                    </SelectStyled>
                  </FormGroup>
                )}
                <FormGroup>
                  <FormLabel htmlFor="legalInfo">Legal Information *</FormLabel>
                  <FormInput
                    id="legalInfo"
                    type="text"
                    placeholder="Enter legal information"
                    value={attestationForm.legalInfo}
                    onChange={(e) =>
                      setAttestationForm({
                        ...attestationForm,
                        legalInfo: e.target.value,
                      })
                    }
                    required
                    maxLength={200}
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <ModalButton
                  type="button"
                  className="cancel"
                  onClick={() => setShowAttestationModal(false)}
                >
                  Cancel
                </ModalButton>
                <ModalButton
                  type="submit"
                  className="submit"
                  disabled={
                    !attestationForm.employeeId ||
                    !attestationForm.legalInfo?.trim()
                  }
                >
                  Generate
                </ModalButton>
              </ModalFooter>
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && (
        <ModalOverlay onClick={() => setShowPayslipModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Generate Payslip</ModalTitle>
              <CloseButton onClick={() => setShowPayslipModal(false)}>
                &times;
              </CloseButton>
            </ModalHeader>
            <form onSubmit={handleGeneratePayslip}>
              <ModalBody>
                <FormGroup>
                  <FormLabel htmlFor="employeeId">Employee *</FormLabel>
                  <SelectStyled
                    id="employeeId"
                    value={payslipForm.employeeId}
                    onChange={(e) =>
                      setPayslipForm({
                        ...payslipForm,
                        employeeId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees && employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp.id || emp._id} value={emp.id || emp._id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No employees available</option>
                    )}
                  </SelectStyled>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="month">Month *</FormLabel>
                  <SelectStyled
                    id="month"
                    value={payslipForm.month}
                    onChange={(e) =>
                      setPayslipForm({ ...payslipForm, month: e.target.value })
                    }
                    required
                  >
                    <option value="">Select month</option>
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((m, i) => (
                      <option key={i} value={(i + 1).toString()}>
                        {m}
                      </option>
                    ))}
                  </SelectStyled>
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="year">Year *</FormLabel>
                  <FormInput
                    id="year"
                    type="number"
                    placeholder="Enter year"
                    value={payslipForm.year}
                    onChange={(e) =>
                      setPayslipForm({ ...payslipForm, year: e.target.value })
                    }
                    required
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="salary">Salary ($) *</FormLabel>
                  <FormInput
                    id="salary"
                    type="number"
                    placeholder="Enter salary"
                    value={payslipForm.salary}
                    onChange={(e) =>
                      setPayslipForm({
                        ...payslipForm,
                        salary: e.target.value,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="deductions">Deductions ($)</FormLabel>
                  <FormInput
                    id="deductions"
                    type="number"
                    placeholder="Enter deductions"
                    value={payslipForm.deductions}
                    onChange={(e) =>
                      setPayslipForm({
                        ...payslipForm,
                        deductions: e.target.value,
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel htmlFor="bonuses">Bonuses ($)</FormLabel>
                  <FormInput
                    id="bonuses"
                    type="number"
                    placeholder="Enter bonuses"
                    value={payslipForm.bonuses}
                    onChange={(e) =>
                      setPayslipForm({
                        ...payslipForm,
                        bonuses: e.target.value,
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <ModalButton
                  type="button"
                  className="cancel"
                  onClick={() => setShowPayslipModal(false)}
                >
                  Cancel
                </ModalButton>
                <ModalButton
                  type="submit"
                  className="submit"
                  disabled={
                    !payslipForm.employeeId ||
                    !payslipForm.month ||
                    !payslipForm.year ||
                    !payslipForm.salary ||
                    parseFloat(payslipForm.salary) <= 0
                  }
                >
                  Generate
                </ModalButton>
              </ModalFooter>
            </form>
          </ModalCard>
        </ModalOverlay>
      )}

      <Popup
        show={popupVisible}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupVisible(false)}
      />
    </>
  );
};

export default Documents;
