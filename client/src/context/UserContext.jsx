import React, { createContext, useState, useEffect } from "react";
import api from "../utils/api";

const UserContext = createContext();

export const UserProvider = ({ children, onUnauthorized }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true for initial check

  useEffect(() => {
    // Attempt to restore user session on mount
    const restoreUserSession = async () => {
      try {
        const response = await api("/api/employees/me", "GET");
        setUser({
          id: response.data.user._id,
          role: response.data.user.role,
        });
      } catch (error) {
        if (error.message.includes("401")) {
          // Call the callback to handle unauthorized state
          if (onUnauthorized) onUnauthorized();
        } else {
          console.error("Error restoring user session:", error);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUserSession();
  }, [onUnauthorized]);

  const setUserFromLogin = (userData) => {
    setLoading(true);
    try {
      setUser({
        id: userData._id,
        role: userData.role,
      });
    } catch (error) {
      console.error("Error setting user from login:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const response = await api("/api/employees/me", "GET");
      setUser({
        id: response.data.user._id,
        role: response.data.user.role,
      });
    } catch (error) {
      if (error.message.includes("401")) {
        if (onUnauthorized) onUnauthorized();
      } else {
        console.error("Error refreshing user:", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    setLoading(false);
  };

  return (
    <UserContext.Provider
      value={{ user, setUserFromLogin, refreshUser, clearUser, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
