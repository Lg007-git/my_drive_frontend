import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && parsed.id && parsed.token) {
        setUser(parsed);
      } else {
        localStorage.removeItem("user"); // cleanup bad data
      }
    } catch (err) {
      console.error("Invalid user JSON in localStorage", err);
      localStorage.removeItem("user"); // cleanup if broken
    }
  }, []);

  // Save user + token when logging in
  const login = (id, token, email) => {
    const userData = { id, email, token };
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  // Clear user on logout
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
