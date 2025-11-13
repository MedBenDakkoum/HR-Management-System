import React, { useContext } from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCalendarCheck,
  FaFileAlt,
  FaClipboardList,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { colors } from "../styles/GlobalStyle";
import { COLORS } from "../utils/constants";
import UserContext from "../context/UserContext";

const SidebarWrapper = styled.div`
  position: fixed;
  top: 82px; /* start right below navbar height */
  left: 10px;
  width: 200px;
  height: calc(100vh - 52px); /* full height minus navbar */
  background-color: white;
  padding: 20px;
  border-right: 1px solid ${colors.secondary};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 999; /* below navbar */

  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  transition: all 0.3s ease;

  /* Smooth scroll */
  scroll-behavior: smooth;

  /* Thin scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    transform: ${(props) =>
      props.$isOpen ? "translateX(0)" : "translateX(-100%)"};
    width: 280px;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    border-radius: 0;
    border-right: none;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.15);
    z-index: 10000;
  }

  @media (max-width: 480px) {
    width: 100%;
    top: 66px;
    height: calc(100vh - 66px);
  }
`;

// Mobile overlay
const MobileOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;

  @media (max-width: 768px) {
    display: ${(props) => (props.$isOpen ? "block" : "none")};
  }
`;

const SidebarLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: ${colors.text};
  text-decoration: none;
  border-radius: 5px;
  transition: all 0.2s ease;

  &.active {
    background-color: ${colors.background};
    color: ${COLORS.primary};
    font-weight: bold;
  }

  &:hover {
    background-color: ${colors.background};
  }

  @media (max-width: 768px) {
    padding: 15px 20px;
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    padding: 18px 20px;
    font-size: 1.2rem;
  }
`;

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, loading } = useContext(UserContext);

  // Get links based on user role
  const getLinks = () => {
    const baseLinks = [
      { to: "/attendance", label: "Attendance", icon: <FaCalendarCheck /> },
      { to: "/documents", label: "Documents", icon: <FaFileAlt /> },
      { to: "/leaves", label: "Leaves", icon: <FaClipboardList /> },
    ];

    // Add Dashboard link only for admin users
    if (user && user.role === "admin") {
      return [
        { to: "/dashboard", label: "Dashboard", icon: <FaHome /> },
        ...baseLinks,
      ];
    }

    return baseLinks;
  };

  // Conditional profile/employees link based on user role
  const getProfileLink = () => {
    if (loading) {
      return null; // Don't render until user context is loaded
    }

    if (!user) {
      // No user (unauthenticated), show nothing
      return null;
    }

    // Same route (/profile) but different label and icon based on role
    const isActive = location.pathname === "/profile";
    const label = user.role === "admin" ? "Employees" : "Profile";
    const icon = user.role === "admin" ? <FaUsers /> : <FaUser />;

    return (
      <SidebarLink to="/profile" className={isActive ? "active" : ""}>
        {icon} {label}
      </SidebarLink>
    );
  };

  return (
    <>
      <MobileOverlay $isOpen={isOpen} onClick={onClose} />
      <SidebarWrapper $isOpen={isOpen}>
        {getLinks().map((link) => (
          <SidebarLink
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? "active" : ""}
            onClick={onClose}
          >
            {link.icon} {link.label}
          </SidebarLink>
        ))}

        {/* Conditional Profile/Employees link */}
        {getProfileLink()}
      </SidebarWrapper>
    </>
  );
};

export default Sidebar;
