"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      setError("");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      padding: "20px"
    }}>
      {/* Background Container */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/assets/images/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: -2
      }}></div>

      {/* Background Overlay */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: isDarkMode ? "rgba(23, 37, 84, 0.7)" : "rgba(255, 255, 255, 0.8)",
        zIndex: -1
      }}></div>

      {/* Main Layout */}
      <div style={{
        display: "flex",
        width: "100%",
        height: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        gap: "40px",
        flexWrap: "wrap"
      }}>
        {/* Login Section */}
        <div style={{
          flex: "1 1 400px",
          display: "flex",
          justifyContent: "center",
          maxWidth: "500px",
          padding: "10px"
        }}>
          <div style={{
            background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.1)"}`,
            borderRadius: "20px",
            padding: "30px 25px",
            width: "100%",
            boxShadow: isDarkMode ? "0 8px 32px 0 rgba(0, 0, 0, 0.3)" : "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
            color: isDarkMode ? "white" : "#1f2937"
          }}>
            <div style={{ marginBottom: "25px" }}>
              <p style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                marginBottom: "5px"
              }}>
                Welcome to <span style={{
                  color: "#60a5fa",
                  fontWeight: 700
                }}>Midas</span>
              </p>
              <h2 style={{
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: "10px"
              }}>Login</h2>
              <p style={{
                fontSize: "0.75rem",
                lineHeight: "1.4",
                color: isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(31, 41, 55, 0.8)",
                marginBottom: "20px"
              }}>
                An intelligent system for analyzing antibiogram data, delivering visual insights to support effective antibiotic selection and combat antimicrobial resistance.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="username" style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: isDarkMode ? "white" : "#374151"
                }}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)",
                    border: "1px solid transparent",
                    borderRadius: "8px",
                    color: isDarkMode ? "white" : "#1f2937",
                    fontSize: "0.9rem",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.3s ease",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.target.style.background = isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)";
                    e.target.style.borderColor = isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(59, 130, 246, 0.5)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)";
                    e.target.style.borderColor = "transparent";
                  }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label htmlFor="password" style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "8px",
                  fontWeight: 600,
                  color: isDarkMode ? "white" : "#374151"
                }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)",
                    border: "1px solid transparent",
                    borderRadius: "8px",
                    color: isDarkMode ? "white" : "#1f2937",
                    fontSize: "0.9rem",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.3s ease",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.target.style.background = isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)";
                    e.target.style.borderColor = isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(59, 130, 246, 0.5)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)";
                    e.target.style.borderColor = "transparent";
                  }}
                />
              </div>

              {error && <p style={{
                color: "#ef4444",
                fontSize: "0.85rem",
                marginBottom: "10px"
              }}>{error}</p>}

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#3b82f6",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: "white",
                  marginTop: "10px",
                  boxSizing: "border-box"
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "#3b82f6";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Login
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: isDarkMode ? "white" : "#374151",
                  marginTop: "10px",
                  boxSizing: "border-box"
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Force Logout (for testing)
              </button>
            </form>
          </div>
        </div>

        {/* Brand Section */}
        <div style={{
          flex: "1 1 300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "10px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            <img
              src="/assets/images/logo.png"
              alt="MIDAS Logo"
              style={{
                width: "100%",
                maxWidth: "350px",
                height: "auto",
                objectFit: "contain",
                filter: isDarkMode
                  ? "drop-shadow(0 0px 6px rgba(96, 165, 250, 0.5))"
                  : "drop-shadow(0 0px 6px rgba(0, 0, 0, 0.2))"
              }}
            />
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="flex-wrap: wrap"] {
            flex-direction: column !important;
            gap: 20px !important;
            padding: 15px !important;
          }
          div[style*="flex: 1 1 400px"] {
            flex: 1 1 100% !important;
            max-width: 100% !important;
            padding: 5px !important;
          }
          div[style*="flex: 1 1 300px"] {
            flex: 1 1 100% !important;
            max-width: 100% !important;
          }
          img[src*="logo.png"] {
            max-width: 250px !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="padding: 20px"] {
            padding: 10px !important;
          }
          div[style*="padding: 30px 25px"] {
            padding: 20px 15px !important;
          }
          h2[style*="2rem"] {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
