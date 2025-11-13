import React, { useContext, useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCheck,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { colors } from "../styles/GlobalStyle";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import UserContext from "../context/UserContext";
import { getTimeAgo as formatTimeAgo } from "../utils/firebaseHelpers";

// Fixed Navbar wrapper
const NavbarWrapper = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${colors.primary};
  padding: 10px 30px;
  height: 52px; /* explicit navbar height */
  color: white;
  position: fixed;
  top: 10px; /* small offset from top for shadow effect */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px); /* leave some margin on sides */
  max-width: 1200px; /* limit max width for professional look */
  z-index: 9999;
  box-sizing: border-box;

  border-radius: 12px; /* smooth rounded edges */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); /* soft shadow */
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); /* subtle hover effect */
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    width: calc(100% - 20px);
    border-radius: 8px;
  }

  @media (max-width: 480px) {
    padding: 8px 15px;
    height: 48px;
    width: calc(100% - 16px);
    border-radius: 6px;
  }
`;

// Spacer to prevent content from hiding behind navbar
export const NavbarSpacer = styled.div`
  height: 60px; /* match navbar height */

  @media (max-width: 480px) {
    height: 56px;
  }
`;

// Logo image
const Logo = styled.img`
  height: 40px; /* adjust height as needed */
  object-fit: contain;

  @media (max-width: 768px) {
    height: 35px;
  }

  @media (max-width: 480px) {
    height: 30px;
  }
`;

// Icons container
const Icons = styled.div`
  display: flex;
  gap: 15px;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

// Each icon
const Icon = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.2s ease, color 0.2s ease;

  &:hover {
    color: ${"#FFD700"}; // you can pick a subtle highlight color
    transform: scale(1.2); // slight grow effect
  }
`;

// Mobile menu button
const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// Notification dropdown wrapper
const NotificationWrapper = styled.div`
  position: relative;
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4500;
  color: white;
  font-size: 0.55rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  animation: pulse 1.5s infinite;
  z-index: 1;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: calc(100% + 20px);
  right: -10px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  width: 380px;
  max-height: 500px;
  overflow: hidden;
  z-index: 10001;
  animation: slideDown 0.2s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    right: -50px;
    width: 320px;
  }
`;

const NotificationHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${colors.background || "#F8F7F6"};
`;

const NotificationTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
`;

const MarkAllRead = styled.button`
  background: none;
  border: none;
  color: ${colors.accent || "#f18500"};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(241, 133, 0, 0.1);
  }
`;

const NotificationList = styled.div`
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
`;

const NotificationItemStyled = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$unread ? "#fef3e7" : "white")};
  position: relative;

  &:hover {
    background: ${colors.background || "#F8F7F6"};
  }

  &:last-child {
    border-bottom: none;
  }

  &::after {
    content: ${(props) => (props.$unread ? '"●"' : '""')};
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: ${colors.accent || "#f18500"};
    font-size: 1.2rem;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  gap: 12px;
  align-items: start;
`;

const NotificationIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${(props) => {
    switch (props.$type) {
      case "late_arrival":
        return "#fee2e2";
      case "location_issue":
        return "#fef3c7";
      case "leave_request":
        return "#dbeafe";
      case "leave_approved":
        return "#d1fae5";
      case "leave_rejected":
        return "#fee2e2";
      default:
        return "#e5e7eb";
    }
  }};
  color: ${(props) => {
    switch (props.$type) {
      case "late_arrival":
        return "#dc2626";
      case "location_issue":
        return "#d97706";
      case "leave_request":
        return "#2563eb";
      case "leave_approved":
        return "#059669";
      case "leave_rejected":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  }};
`;

const NotificationText = styled.div`
  flex: 1;
  min-width: 0;
  padding-right: 24px;
`;

const NotificationMessage = styled.p`
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: ${(props) => (props.$unread ? 600 : 400)};
  line-height: 1.4;
`;

const NotificationTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const EmptyNotifications = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
`;

const NotificationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
`;

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { clearUser, user } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handleLogout = async () => {
    try {
      await api("/api/employees/logout", "POST");
      clearUser();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  // Fetch notifications with limit
  const fetchNotifications = useCallback(
    async (limit = 20) => {
      if (!user?.id) return;
      try {
        const response = await api(
          `/api/employees/${user.id}/notifications?limit=${limit}`,
          "GET"
        );
        setNotifications(response.data?.notifications || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        // If endpoint doesn't exist, use mock data
        setNotifications([]);
      }
    },
    [user]
  );

  useEffect(() => {
    // Initial fetch with limited notifications
    fetchNotifications(20);
    // Poll for new notifications every 30 seconds (also limited)
    const interval = setInterval(() => fetchNotifications(20), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!notificationOpen) return;

    const handleClickOutside = (event) => {
      // Check if click is outside the notification wrapper
      const notificationElement = event.target.closest(".notification-wrapper");

      if (!notificationElement) {
        console.log("Clicking outside notification area, closing dropdown");
        setNotificationOpen(false);
      } else {
        console.log("Clicking inside notification area, keeping dropdown open");
      }
    };

    // Use a small delay to allow click events to process first
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [notificationOpen]);

  const markAsRead = async (notificationId, event) => {
    console.log("=== Mark as Read Called ===");
    console.log("Notification ID:", notificationId);
    console.log("Current notifications:", notifications);
    console.log("Current unread count:", unreadCount);

    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Find the notification to check if it exists
    const notification = notifications.find((n) => n._id === notificationId);
    console.log("Found notification:", notification);

    if (!notification) {
      console.error("Notification not found in state!");
      return;
    }

    if (notification.read) {
      console.log("Notification already marked as read");
      return;
    }

    // Optimistically update UI first
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n._id === notificationId ? { ...n, read: true } : n
      );
      console.log("After update - notifications:", updated);
      const newUnreadCount = updated.filter((n) => !n.read).length;
      console.log("After update - unread count should be:", newUnreadCount);
      return updated;
    });

    try {
      console.log("Calling API to mark as read...");
      const response = await api(
        `/api/employees/notifications/${notificationId}/read`,
        "PATCH"
      );
      console.log("API response:", response);
    } catch (error) {
      console.error("API call failed:", error);
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: false } : n))
      );
    }
  };

  const markAllAsRead = async (event) => {
    if (event) {
      event.stopPropagation();
    }

    // Optimistically update UI first
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const response = await api(
        `/api/employees/${user.id}/notifications/read-all`,
        "PATCH"
      );
      console.log("Mark all as read response:", response);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Refresh notifications on error
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "late_arrival":
        return <FaClock />;
      case "location_issue":
        return <FaMapMarkerAlt />;
      case "leave_request":
      case "leave_approved":
      case "leave_rejected":
        return <FaCalendarAlt />;
      default:
        return <FaBell />;
    }
  };

  const getTimeAgo = (timestamp) => {
    // Use the Firebase helper to properly handle Firestore Timestamps
    return formatTimeAgo(timestamp);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Display logic for notification badge
  const getNotificationBadgeText = (count) => {
    if (count === 0) return null;
    if (count <= 9) return count.toString();
    return "+9";
  };

  // Debug logging
  useEffect(() => {
    console.log("Notifications updated:", notifications);
    console.log("Unread count:", unreadCount);
  }, [notifications, unreadCount]);

  return (
    <>
      <NavbarWrapper>
        <Logo src="/flesk-logo.png" alt="FLESK HR Logo" />
        <MobileMenuButton onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuButton>
        <Icons>
          <NotificationWrapper className="notification-wrapper">
            <Icon
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                // Fetch latest notifications when opening dropdown
                if (!notificationOpen) {
                  fetchNotifications(20);
                }
              }}
            >
              <FaBell />
              {unreadCount > 0 && (
                <NotificationBadge>
                  {getNotificationBadgeText(unreadCount)}
                </NotificationBadge>
              )}
            </Icon>

            {notificationOpen && (
              <NotificationDropdown onClick={(e) => e.stopPropagation()}>
                <NotificationHeader>
                  <NotificationTitle>Notifications</NotificationTitle>
                  {unreadCount > 0 && (
                    <MarkAllRead onClick={(e) => markAllAsRead(e)}>
                      Mark all read
                    </MarkAllRead>
                  )}
                </NotificationHeader>

                <NotificationList onClick={(e) => e.stopPropagation()}>
                  {notifications.length === 0 ? (
                    <EmptyNotifications>
                      <FaBell
                        style={{
                          fontSize: "2rem",
                          marginBottom: "8px",
                          opacity: 0.3,
                        }}
                      />
                      <p style={{ margin: 0 }}>No notifications yet</p>
                    </EmptyNotifications>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItemStyled
                        key={notification._id}
                        $unread={!notification.read}
                        onClick={(e) => markAsRead(notification._id, e)}
                      >
                        <NotificationContent>
                          <NotificationIcon $type={notification.type}>
                            {getNotificationIcon(notification.type)}
                          </NotificationIcon>
                          <NotificationText>
                            <NotificationMessage $unread={!notification.read}>
                              {notification.message}
                            </NotificationMessage>
                            <NotificationTime>
                              {getTimeAgo(notification.timestamp)}
                            </NotificationTime>
                          </NotificationText>
                        </NotificationContent>
                      </NotificationItemStyled>
                    ))
                  )}
                </NotificationList>
              </NotificationDropdown>
            )}
          </NotificationWrapper>

          <Icon onClick={() => navigate("/profile")}>
            <FaUserCircle />
          </Icon>
          <Icon onClick={handleLogout}>
            <FaSignOutAlt />
          </Icon>
        </Icons>
      </NavbarWrapper>
    </>
  );
};

export default Navbar;
