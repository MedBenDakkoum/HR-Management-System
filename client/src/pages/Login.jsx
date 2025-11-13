import React, { useState, useContext, useCallback } from "react";
import styled from "styled-components";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import { FaUserCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import Loading from "../components/Loading";
import Popup from "../components/Popup";

// --- Styled Components ---
const LoginWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #85929e 0%, #657786 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px
    );
    background-size: 50px 50px;
    animation: moveBackground 20s linear infinite;
  }

  @keyframes moveBackground {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(50px, 50px);
    }
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const Form = styled.form`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 40px 36px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 480px) {
    width: 100%;
    max-width: 400px;
    padding: 36px 28px;
    gap: 18px;
  }

  @media (max-width: 360px) {
    padding: 32px 24px;
    gap: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4px;
`;

const IconCard = styled.div`
  background: white;
  padding: 8px 10px;
  border-radius: 30%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 9px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    margin-bottom: 8px;
  }
`;

const Icon = styled(FaUserCircle)`
  font-size: 2rem;
  color: black;

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const Title = styled.h2`
  text-align: center;
  color: #000000;
  font-size: 1.5rem;
  margin-bottom: 15px;
  margin-top: 1px;

  @media (max-width: 480px) {
    font-size: 1.375rem;
    margin-bottom: 12px;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  color: #657786;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: #000000;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: -2px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  display: block;
  background: #f8f7f6;

  &:focus {
    border-color: #f18500;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1);
  }

  &::placeholder {
    color: #85929e;
  }

  @media (max-width: 480px) {
    padding: 11px 12px;
    font-size: 0.9rem;
  }
`;

const Button = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #ff4500 0%, #f18500 100%);
  color: white;
  padding: 12px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 69, 0, 0.5);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 480px) {
    padding: 11px;
    font-size: 0.95rem;
  }
`;

const HelperText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: #657786;
  margin-top: 4px;
  font-weight: 500;

  a {
    color: #ff4500;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;

    &:hover {
      color: #f18500;
      text-decoration: underline;
    }
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    margin-top: 2px;
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PasswordInputField = styled.div`
  position: relative;
  width: 100%;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 12px 46px 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  display: block;
  background: #f8f7f6;

  &:focus {
    border-color: #f18500;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1);
  }

  &::placeholder {
    color: #85929e;
  }

  @media (max-width: 480px) {
    padding: 11px 44px 11px 12px;
    font-size: 0.9rem;
  }
`;

const EyeIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 1.1rem;
  color: #657786;
  transition: all 0.2s ease;

  &:hover {
    color: #ff4500;
    transform: translateY(-50%) scale(1.1);
  }

  @media (max-width: 480px) {
    right: 10px;
    font-size: 1rem;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  color: #85929e;
  font-size: 0.8rem;
  margin: 4px 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }

  &::before {
    margin-right: 10px;
  }

  &::after {
    margin-left: 10px;
  }
`;

// --- Login Component ---
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState("error");
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();
  const { setUserFromLogin } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);

  const showPopup = useCallback((type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  }, []);

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Validation ---
    if (!email || !password) {
      showPopup("error", "Please enter both email and password.");
      return;
    }

    if (!validateEmail(email)) {
      showPopup("error", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      // Clear any existing mobile token
      localStorage.removeItem("mobile_auth_token");

      const response = await api("/api/employees/login", "POST", {
        email,
        password,
      });

      if (response.success) {
        const userResponse = await api("/api/employees/me", "GET");
        const user = userResponse.data.user;
        setUserFromLogin(user);

        // Redirect based on user role
        if (user.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/attendance");
        }
      } else {
        showPopup("error", response.message || "Incorrect email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle specific error messages from the server
      if (
        error.message &&
        error.message !== "Server error. Please try again later."
      ) {
        showPopup("error", error.message);
      } else {
        showPopup("error", "Server error. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading text="Logging in..." />;

  return (
    <LoginWrapper>
      <Form onSubmit={handleSubmit}>
        <Header>
          <IconCard>
            <Icon />
          </IconCard>
          <Title>Welcome Back</Title>
          <Subtitle>Sign in to access your account</Subtitle>
        </Header>

        <InputWrapper>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </InputWrapper>

        <PasswordWrapper>
          <Label htmlFor="password">Password</Label>
          <PasswordInputField>
            <PasswordInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <EyeIcon onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </EyeIcon>
          </PasswordInputField>
        </PasswordWrapper>

        <Button type="submit">Sign In</Button>

        <Divider>or</Divider>

        <HelperText>
          Don't have an account? <a href="/Contact">Contact HR</a>
        </HelperText>
      </Form>

      <Popup
        show={popupVisible}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupVisible(false)}
      />
    </LoginWrapper>
  );
};

export default Login;
