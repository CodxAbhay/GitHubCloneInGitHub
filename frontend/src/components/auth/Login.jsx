import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@primer/react";
import "./auth.css";
import logo from "../../assets/github-mark-white.svg";
import { API_BASE_URL } from "../../apiBase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setCurrentUser, setToken } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);

      setCurrentUser(res.data.userId);
      setToken(res.data.token);

      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Login Failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        {/* Left Panel */}
        <div className="left-panel">
          <img src={logo} alt="Logo" className="logo" />
          <h1>Welcome back.</h1>
          <p>
            Sign in to continue building and collaborating on your projects.
          </p>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <form className="form-card" onSubmit={handleLogin}>
            <h2>Sign in to your account</h2>

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <p className="login-text">
              New to GitHub? <Link to="/signup">Create an account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;