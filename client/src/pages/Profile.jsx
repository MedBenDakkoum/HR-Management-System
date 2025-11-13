import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import styled from "styled-components";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import UserContext from "../context/UserContext";
import DatePicker from "react-datepicker";
import { formatFirestoreDate, firestoreTimestampToDate } from "../utils/firebaseHelpers";
import "react-datepicker/dist/react-datepicker.css";
import { colors } from "../styles/GlobalStyle";
import {
  FaRegCalendarAlt,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaEnvelope,
  FaBriefcase,
  FaCalendar,
  FaTimes,
  FaCamera,
  FaUserGraduate,
} from "react-icons/fa";
import * as faceapi from "face-api.js";
import Popup from "../components/Popup";
import Loading from "../components/Loading";

const ProfileWrapper = styled.div`
  display: flex;
  margin-left: 250px;
  margin-top: 40px;
  padding: 20px 60px 40px 60px;
  min-height: calc(100vh - 70px);
  background: #f5f7fa;

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
  max-width: 1400px;
  width: 100%;

  @media (max-width: 768px) {
    max-width: 100%;
    align-items: center;
  }
`;

// Modern Header Section
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;

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
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const AddButton = styled.button`
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
  background: ${colors.accent || "#f18500"};
  color: white;

  &:hover {
    background: ${colors.tertialy || "#e07b00"};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

// Employee Grid
const EmployeesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const EmployeeCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
    border-color: ${colors.accent || "#f18500"};
  }
`;

const EmployeeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const EmployeeAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${colors.accent || "#f18500"} 0%,
    ${colors.tertialy || "#e07b00"} 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const EmployeeActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 480px) {
    width: 100%;
    margin-top: 12px;
  }
`;

const IconButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(props) =>
    props.$variant === "delete" ? "#fee2e2" : "#dbeafe"};
  color: ${(props) => (props.$variant === "delete" ? "#dc2626" : "#2563eb")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: ${(props) =>
      props.$variant === "delete" ? "#fecaca" : "#bfdbfe"};
  }

  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
`;

const EmployeeName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
`;

const EmployeeRole = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${(props) => {
    if (props.$role === "admin") return "#dbeafe";
    if (props.$role === "stagiaire") return "#fef3c7";
    return "#d1fae5";
  }};
  color: ${(props) => {
    if (props.$role === "admin") return "#2563eb";
    if (props.$role === "stagiaire") return "#d97706";
    return "#059669";
  }};
  margin-bottom: 12px;
`;

const EmployeeDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 8px;

  svg {
    color: ${colors.primary || "#85929E"};
    flex-shrink: 0;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

// Modal for Add/Edit Employee
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
  z-index: 10000;
  padding: 20px;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
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
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
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
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FormInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${colors.accent || "#f18500"};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.1);
  }
`;

const FormSelect = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${colors.accent || "#f18500"};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.1);
  }
`;

const FormTextArea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${colors.accent || "#f18500"};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.1);
  }
`;

const ModalFooter = styled.div`
  padding: 24px 32px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;
`;

const ModalButton = styled.button`
  width: 90%;
  padding: 12px 14px;
  border: 1px solid ${colors.primary};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &.cancel {
    background: transparent;
    color: #6b7280;
    border: 2px solid #e5e7eb;
  }

  &.submit {
    background: ${colors.accent || "#f18500"};
    color: white;
  }

  &.submit:hover:not(:disabled) {
    background: ${colors.tertialy || "#e07b00"};
    transform: translateY(-1px);
  }

  &.cancel:hover {
    background: #f9fafb;
    color: #374151;
  }

  &:disabled {
    background: #d1d5db;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
`;

const EmptyIcon = styled(FaUsers)`
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.3;
  color: ${colors.primary || "#85929E"};
`;

const SectionDivider = styled.div`
  margin: 8px 0;
  border-top: 1px solid #e5e7eb;
`;

const FormCard = styled.form`
  background-color: white;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 400px;
    padding: 30px 25px;
    margin: 0 auto 20px auto;
  }

  @media (max-width: 480px) {
    padding: 25px 20px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 100%;
  }
`;

const ProfileCard = styled.div`
  background-color: white;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 400px;
    padding: 30px 25px;
    margin: 0 auto 20px auto;
    align-self: center;
  }

  @media (max-width: 480px) {
    padding: 25px 20px;
    margin: 0 auto 20px auto;
    width: 100%;
    max-width: 100%;
    align-self: center;
  }
`;

const FormHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  color: #333;
  margin: 0;
`;

const VideoContainer = styled.div`
  position: relative;
  width: 90%;
  margin-bottom: 10px;
  display: ${(props) => (props.$show ? "block" : "none")};
`;

const Video = styled.video`
  width: 100%;
  border-radius: 8px;
  border: 1px solid ${colors.primary};
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
`;

const ButtonStyled = styled.button`
  width: 99%;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  background-color: ${(props) => (props.$stop ? "#dc3545" : "#f18500")};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const InputStyled = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${colors.primary};
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${colors.tertialy};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.2);
  }
`;

const SelectStyled = styled.select`
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${colors.primary};
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${colors.tertialy};
    box-shadow: 0 0 0 3px rgba(241, 133, 0, 0.2);
  }
`;

const DetailText = styled.div`
  width: 90%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${colors.primary};
  font-size: 0.95rem;
  color: #333;
  background: #f9fafb;
`;

const DateInputWrapper = styled.div`
  position: relative;
  width: 90%;
`;

const DateIcon = styled(FaRegCalendarAlt)`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #657786;
  pointer-events: none;
  font-size: 1rem;
`;

const Profile = () => {
  const { user, loading } = useContext(UserContext);
  const [employeeData, setEmployeeData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState("success");
  const [popupMessage, setPopupMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add User functionality from second code
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    position: "",
    hireDate: "",
    internshipDetails: {
      startDate: "",
      endDate: "",
      supervisor: "",
      objectives: "",
    },
  });

  const showPopup = useCallback((type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setShowCamera(false);
    }
  }, [stream]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        );
        console.log("Tiny face detector model loaded.");
        await faceapi.nets.faceLandmark68Net.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        );
        console.log("Face landmark 68 model loaded.");
        await faceapi.nets.faceRecognitionNet.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        );
        console.log("Face recognition model loaded.");
        console.log("All face-api models loaded successfully.");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load models:", error);
        showPopup("error", "Failed to load models. Refresh page.");
        stopCamera();
      }
    };
    loadModels();
  }, [stopCamera, showPopup]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || loading) return;
      try {
        if (user.role === "admin") {
          const response = await api("/api/employees", "GET");
          setEmployees(response.data.employees || []);
          const employeeId = selectedEmployeeId || user.id;
          const employeeResponse = await api(
            `/api/employees/${employeeId}`,
            "GET"
          );
          const data = employeeResponse.data.employee;
          setEmployeeData(data);
          setName(data.name || "");
          setEmail(data.email || "");
          setPosition(data.position || "");
          setHireDate(data.hireDate ? new Date(data.hireDate) : null);
          setQrCode(data.qrCode || "");
        } else {
          const response = await api(`/api/employees/${user.id}`, "GET");
          const data = response.data.employee;
          setEmployeeData(data);
        }
      } catch (error) {
        console.log("Failed to fetch employee data.", error);
        showPopup("error", "Failed to fetch employee data.");
      }
    };
    fetchData();
  }, [user, loading, selectedEmployeeId, showPopup]);

  const startCamera = useCallback(async () => {
    if (!stream) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setShowCamera(true);
      } catch (error) {
        console.log("Camera access failed. Check permissions.", error);
        showPopup("error", "Camera access failed. Check permissions.");
        stopCamera();
      }
    }
  }, [stream, showPopup, stopCamera]);

  const handleUpdateProfile = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user?.id) {
        showPopup("error", "User not authenticated");
        return;
      }
      try {
        const updateData = {
          name,
          email,
          position,
          hireDate: hireDate ? hireDate.toISOString() : undefined,
          qrCode,
        };
        const employeeId =
          user.role === "admin" ? selectedEmployeeId || user.id : user.id;
        await api(`/api/employees/${employeeId}`, "PATCH", updateData);
        showPopup("success", "Profile updated successfully");
        const response = await api(`/api/employees/${employeeId}`, "GET");
        const data = response.data.employee;
        setEmployeeData(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setPosition(data.position || "");
        setHireDate(data.hireDate ? firestoreTimestampToDate(data.hireDate) : null);
        setQrCode(data.qrCode || "");
      } catch (error) {
        console.log("Profile update failed. Try again.", error);
        showPopup("error", "Profile update failed. Try again.");
      }
    },
    [
      user,
      selectedEmployeeId,
      name,
      email,
      position,
      hireDate,
      qrCode,
      showPopup,
    ]
  );

  const handleRegisterFace = useCallback(async () => {
    if (!modelsLoaded) {
      showPopup("error", "Models not loaded. Refresh page.");
      stopCamera();
      return;
    }
    await startCamera();
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (videoRef.current?.readyState >= 2) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    // Additional delay to allow camera to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      console.log("Attempting face detection...");
      console.log("Video readyState:", videoRef.current.readyState);
      console.log(
        "Video dimensions:",
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.3,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();
      console.log("Detections length:", detections.length);
      if (detections.length === 0) {
        console.log("No face detected in this attempt.");
        showPopup("error", "No face detected. Adjust and retry.");
        stopCamera();
        return;
      }
      const faceDescriptor = Array.from(detections[0].descriptor);
      const employeeId =
        user.role === "admin" ? selectedEmployeeId || user.id : user.id;
      await api(`/api/employees/face-template/${employeeId}`, "PATCH", {
        faceDescriptor,
      });
      console.log("Face data saved successfully.");
      showPopup("success", "Face data saved successfully.");
      const response = await api(`/api/employees/${employeeId}`, "GET");
      setEmployeeData(response.data.employee);
    } catch (error) {
      console.error("Error during face registration:", error);
      showPopup("error", "Error occurred. Please retry.");
    } finally {
      stopCamera();
    }
  }, [
    user,
    selectedEmployeeId,
    modelsLoaded,
    startCamera,
    stopCamera,
    showPopup,
  ]);

  // QR Code generation function
  const generateQRCode = useCallback(async () => {
    try {
      const employeeId =
        user.role === "admin" ? selectedEmployeeId || user.id : user.id;

      if (!employeeId) {
        showPopup("error", "Employee ID not found");
        return;
      }

      showPopup("success", "Generating QR code...");

      const response = await api(`/api/attendance/qr/${employeeId}`, "GET");

      if (response.data && response.data.qrCodeUrl) {
        setQrCode(response.data.qrCodeUrl);
        // Update employeeData to trigger re-render
        setEmployeeData((prevData) => ({
          ...prevData,
          qrCode: response.data.qrCodeUrl,
        }));
        showPopup("success", "QR code generated successfully!");
      } else {
        showPopup("error", "Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      showPopup("error", "Failed to generate QR code. Please try again.");
    }
  }, [user, selectedEmployeeId, showPopup]);

  // Add User functionality from second code
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newUser,
        hireDate:
          newUser.role === "employee" && newUser.hireDate
            ? new Date(newUser.hireDate)
            : undefined,
        internshipDetails: {
          ...newUser.internshipDetails,
          startDate: newUser.internshipDetails.startDate
            ? new Date(newUser.internshipDetails.startDate)
            : undefined,
          endDate: newUser.internshipDetails.endDate
            ? new Date(newUser.internshipDetails.endDate)
            : undefined,
        },
      };
      await api("/api/employees/register", "POST", payload);
      showPopup("success", "User created successfully");
      setShowAddForm(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "employee",
        position: "",
        hireDate: "",
        internshipDetails: {
          startDate: "",
          endDate: "",
          supervisor: "",
          objectives: "",
        },
      });
      const res = await api("/api/employees", "GET");
      setEmployees(res.data.employees || []);
    } catch (error) {
      console.log("Failed to create user", error);
      showPopup("error", "Failed to create user");
    }
  };

  if (loading || !employeeData)
    return <Loading text="Loading profile data..." />;

  const handleMenuToggle = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <Navbar onMenuToggle={handleMenuToggle} />
      <ProfileWrapper>
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        <Content>
          {user.role === "admin" ? (
            <>
              {/* Modern Header */}
              <PageHeader>
                <PageTitle>
                  <FaUsers />
                  Employee Management
                </PageTitle>
                <AddButton onClick={() => setShowAddForm(true)}>
                  <FaPlus />
                  Add Employee
                </AddButton>
              </PageHeader>

              {/* Employees Grid */}
              <EmployeesGrid>
                {employees.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon />
                    <h3 style={{ color: "#374151", marginBottom: "8px" }}>
                      No Employees Yet
                    </h3>
                    <p style={{ color: "#6b7280" }}>
                      Click "Add Employee" to create your first employee
                    </p>
                  </EmptyState>
                ) : (
                  employees.map((emp) => (
                    <EmployeeCard key={emp._id}>
                      <EmployeeHeader>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <EmployeeAvatar>
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                          </EmployeeAvatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <EmployeeName>{emp.name}</EmployeeName>
                            <EmployeeRole $role={emp.role}>
                              {emp.role === "stagiaire" ? "Intern" : emp.role}
                            </EmployeeRole>
                          </div>
                        </div>
                        <EmployeeActions>
                          <IconButton
                            onClick={() => {
                              setSelectedEmployeeId(emp._id);
                            }}
                            title="Edit employee"
                          >
                            <FaEdit />
                            Edit
                          </IconButton>
                          <IconButton
                            $variant="delete"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete ${emp.name}?`
                                )
                              ) {
                                // Add delete functionality
                                showPopup(
                                  "success",
                                  "Delete functionality to be implemented"
                                );
                              }
                            }}
                            title="Delete employee"
                          >
                            <FaTrash />
                            Delete
                          </IconButton>
                        </EmployeeActions>
                      </EmployeeHeader>

                      <EmployeeDetail>
                        <FaEnvelope />
                        <span>{emp.email}</span>
                      </EmployeeDetail>

                      <EmployeeDetail>
                        <FaBriefcase />
                        <span>{emp.position || "No position assigned"}</span>
                      </EmployeeDetail>

                      {emp.hireDate && (
                        <EmployeeDetail>
                          <FaCalendar />
                          <span>
                            Hired: {formatFirestoreDate(emp.hireDate)}
                          </span>
                        </EmployeeDetail>
                      )}
                    </EmployeeCard>
                  ))
                )}
              </EmployeesGrid>

              {/* Add Employee Modal */}
              {showAddForm && (
                <ModalOverlay onClick={() => setShowAddForm(false)}>
                  <ModalCard onClick={(e) => e.stopPropagation()}>
                    <ModalHeader>
                      <ModalTitle>
                        <FaPlus />
                        Add New Employee
                      </ModalTitle>
                      <CloseButton onClick={() => setShowAddForm(false)}>
                        <FaTimes />
                      </CloseButton>
                    </ModalHeader>
                    <form onSubmit={handleAddUser}>
                      <ModalBody>
                        <FormGroup>
                          <FormLabel>
                            <FaUserTie />
                            Full Name *
                          </FormLabel>
                          <FormInput
                            placeholder="Enter full name"
                            value={newUser.name}
                            onChange={(e) =>
                              setNewUser({ ...newUser, name: e.target.value })
                            }
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <FormLabel>
                            <FaEnvelope />
                            Email Address *
                          </FormLabel>
                          <FormInput
                            type="email"
                            placeholder="Enter email address"
                            value={newUser.email}
                            onChange={(e) =>
                              setNewUser({ ...newUser, email: e.target.value })
                            }
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <FormLabel>Password *</FormLabel>
                          <FormInput
                            type="password"
                            placeholder="Enter password"
                            value={newUser.password}
                            onChange={(e) =>
                              setNewUser({
                                ...newUser,
                                password: e.target.value,
                              })
                            }
                            required
                          />
                        </FormGroup>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px",
                          }}
                        >
                          <FormGroup>
                            <FormLabel>Role *</FormLabel>
                            <FormSelect
                              value={newUser.role}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  role: e.target.value,
                                  hireDate:
                                    e.target.value === "employee"
                                      ? newUser.hireDate
                                      : "",
                                })
                              }
                            >
                              <option value="employee">Employee</option>
                              <option value="stagiaire">Intern</option>
                            </FormSelect>
                          </FormGroup>

                          <FormGroup>
                            <FormLabel>
                              <FaBriefcase />
                              Position
                            </FormLabel>
                            <FormInput
                              placeholder="Enter position"
                              value={newUser.position}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  position: e.target.value,
                                })
                              }
                            />
                          </FormGroup>
                        </div>

                        {newUser.role === "employee" && (
                          <FormGroup>
                            <FormLabel>
                              <FaCalendar />
                              Hire Date
                            </FormLabel>
                            <FormInput
                              type="date"
                              value={newUser.hireDate}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  hireDate: e.target.value,
                                })
                              }
                            />
                          </FormGroup>
                        )}

                        {newUser.role === "stagiaire" && (
                          <>
                            <SectionDivider />
                            <h4
                              style={{
                                margin: "0",
                                color: "#374151",
                                fontSize: "1.1rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <FaUserGraduate />
                              Internship Details
                            </h4>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "16px",
                              }}
                            >
                              <FormGroup>
                                <FormLabel>Start Date</FormLabel>
                                <FormInput
                                  type="date"
                                  value={newUser.internshipDetails.startDate}
                                  onChange={(e) =>
                                    setNewUser({
                                      ...newUser,
                                      internshipDetails: {
                                        ...newUser.internshipDetails,
                                        startDate: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </FormGroup>

                              <FormGroup>
                                <FormLabel>End Date</FormLabel>
                                <FormInput
                                  type="date"
                                  value={newUser.internshipDetails.endDate}
                                  onChange={(e) =>
                                    setNewUser({
                                      ...newUser,
                                      internshipDetails: {
                                        ...newUser.internshipDetails,
                                        endDate: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </FormGroup>
                            </div>

                            <FormGroup>
                              <FormLabel>Supervisor</FormLabel>
                              <FormInput
                                placeholder="Enter supervisor name"
                                value={newUser.internshipDetails.supervisor}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    internshipDetails: {
                                      ...newUser.internshipDetails,
                                      supervisor: e.target.value,
                                    },
                                  })
                                }
                              />
                            </FormGroup>

                            <FormGroup>
                              <FormLabel>Objectives</FormLabel>
                              <FormTextArea
                                placeholder="Enter internship objectives..."
                                value={newUser.internshipDetails.objectives}
                                onChange={(e) =>
                                  setNewUser({
                                    ...newUser,
                                    internshipDetails: {
                                      ...newUser.internshipDetails,
                                      objectives: e.target.value,
                                    },
                                  })
                                }
                              />
                            </FormGroup>
                          </>
                        )}
                      </ModalBody>
                      <ModalFooter>
                        <ModalButton
                          type="button"
                          className="cancel"
                          onClick={() => setShowAddForm(false)}
                        >
                          Cancel
                        </ModalButton>
                        <ModalButton type="submit" className="submit">
                          Create Employee
                        </ModalButton>
                      </ModalFooter>
                    </form>
                  </ModalCard>
                </ModalOverlay>
              )}

              {/* Edit Employee Modal - Shows when employee is selected */}
              {selectedEmployeeId && (
                <ModalOverlay onClick={() => setSelectedEmployeeId("")}>
                  <ModalCard onClick={(e) => e.stopPropagation()}>
                    <ModalHeader>
                      <ModalTitle>
                        <FaEdit />
                        Edit Employee
                      </ModalTitle>
                      <CloseButton onClick={() => setSelectedEmployeeId("")}>
                        <FaTimes />
                      </CloseButton>
                    </ModalHeader>
                    <form onSubmit={handleUpdateProfile}>
                      <ModalBody>
                        <FormGroup>
                          <FormLabel>
                            <FaUserTie />
                            Full Name *
                          </FormLabel>
                          <FormInput
                            placeholder="Enter full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <FormLabel>
                            <FaEnvelope />
                            Email Address *
                          </FormLabel>
                          <FormInput
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </FormGroup>

                        <FormGroup>
                          <FormLabel>
                            <FaBriefcase />
                            Position
                          </FormLabel>
                          <FormInput
                            placeholder="Enter position"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                          />
                        </FormGroup>

                        <FormGroup>
                          <FormLabel>
                            <FaCalendar />
                            Hire Date
                          </FormLabel>
                          <FormInput
                            type="date"
                            value={
                              hireDate
                                ? (() => {
                                    try {
                                      const date = firestoreTimestampToDate(hireDate);
                                      return date && !isNaN(date.getTime())
                                        ? date.toISOString().split("T")[0]
                                        : "";
                                    } catch (e) {
                                      console.error("Error converting hireDate:", e);
                                      return "";
                                    }
                                  })()
                                : ""
                            }
                            onChange={(e) =>
                              setHireDate(
                                e.target.value ? new Date(e.target.value) : null
                              )
                            }
                          />
                        </FormGroup>

                        <FormGroup>
                          <FormLabel>QR Code</FormLabel>
                          <FormInput
                            placeholder="Enter QR code"
                            value={qrCode}
                            onChange={(e) => setQrCode(e.target.value)}
                          />
                        </FormGroup>

                        <SectionDivider />

                        <FormGroup>
                          <FormLabel>
                            <FaCamera />
                            Face Recognition
                          </FormLabel>
                          <VideoContainer
                            $show={showCamera}
                            style={{ width: "100%", margin: "10px 0" }}
                          >
                            <Video ref={videoRef} autoPlay muted />
                          </VideoContainer>
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              width: "100%",
                            }}
                          >
                            <ModalButton
                              type="button"
                              className="submit"
                              onClick={handleRegisterFace}
                              disabled={!modelsLoaded}
                              style={{ flex: 1, minWidth: "auto" }}
                            >
                              {showCamera ? "Capture Face" : "Start Camera"}
                            </ModalButton>
                            {showCamera && (
                              <ModalButton
                                type="button"
                                className="cancel"
                                onClick={stopCamera}
                                style={{ flex: 1, minWidth: "auto" }}
                              >
                                Stop Camera
                              </ModalButton>
                            )}
                          </div>
                        </FormGroup>
                      </ModalBody>
                      <ModalFooter>
                        <ModalButton
                          type="button"
                          className="cancel"
                          onClick={() => setSelectedEmployeeId("")}
                        >
                          Cancel
                        </ModalButton>
                        <ModalButton
                          type="submit"
                          className="submit"
                          disabled={!name || !email}
                        >
                          Update Employee
                        </ModalButton>
                      </ModalFooter>
                    </form>
                  </ModalCard>
                </ModalOverlay>
              )}
            </>
          ) : (
            <>
              {/* Profile Information Card */}
              <ProfileCard>
                <FormHeader>
                  <Title>Your Profile</Title>
                </FormHeader>
                <DetailText>Name: {employeeData.name}</DetailText>
                <DetailText>Email: {employeeData.email}</DetailText>
                <DetailText>
                  Position: {employeeData.position || "N/A"}
                </DetailText>
                <DetailText>
                  Hire Date:{" "}
                  {employeeData.hireDate
                    ? formatFirestoreDate(employeeData.hireDate)
                    : "N/A"}
                </DetailText>
                <DetailText>
                  Face Template:{" "}
                  {employeeData.faceDescriptor
                    ? "Registered"
                    : "Not registered"}
                </DetailText>
              </ProfileCard>

              {/* QR Code Card - Separate */}
              <ProfileCard>
                <FormHeader>
                  <Title>QR Code</Title>
                </FormHeader>
                <DetailText>
                  Status: {employeeData.qrCode ? "Generated" : "Not generated"}
                </DetailText>

                {employeeData.qrCode && (
                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <img
                      src={employeeData.qrCode}
                      alt="QR Code"
                      style={{
                        maxWidth: "250px",
                        maxHeight: "250px",
                        border: "2px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <div
                      style={{
                        marginTop: "15px",
                        fontSize: "0.9rem",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      ⏰ Valid for 12 hours from generation
                    </div>
                  </div>
                )}

                <ModalButton
                  type="button"
                  className="submit"
                  onClick={generateQRCode}
                  style={{ marginTop: employeeData.qrCode ? "10px" : "20px" }}
                >
                  {employeeData.qrCode
                    ? "Generate New QR Code"
                    : "Generate QR Code"}
                </ModalButton>
              </ProfileCard>
            </>
          )}
        </Content>
      </ProfileWrapper>
      <Popup
        show={popupVisible}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupVisible(false)}
      />
    </>
  );
};

export default Profile;
