import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("token");

    if (userId) {
      setCurrentUser(userId);
    }

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    token,
    setToken,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};