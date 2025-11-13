import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const restoreUserSession = async () => {
      try {
        const response = await api("/api/employees/me", "GET");
        setUser({
          id: response.data.user._id,
          role: response.data.user.role,
        });
      } catch (error) {
        if (error.message.includes("401")) {
          setUser(null);
          navigate("/");
        } else {
          console.error("Error restoring user session:", error);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    restoreUserSession();
  }, [navigate]);

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
        setUser(null);
        navigate("/");
      } else {
        console.error("Error refreshing user:", error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    setLoading(false);
  };

  return { user, setUserFromLogin, refreshUser, clearUser, loading };
};
