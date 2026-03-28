import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@primer/react";
import "./auth.css";
import logo from "../../assets/github-mark-white.svg";
import { API_BASE_URL } from "../../apiBase";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setCurrentUser, setToken } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/signup`, {
        email,
        password,
        username,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);

      setCurrentUser(res.data.userId);
      setToken(res.data.token);
      navigate("/"); 
    } catch (err) {
      console.error(err);
      alert("Signup Failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Left Side */}
      <div className="signup-left">
        <img className="logo-login" src={logo} alt="Logo" />
        <h1>Build software better, together.</h1>
        <p>
          Join millions of developers using your GitHub Clone to build,
          collaborate, and ship software faster.
        </p>
      </div>

      {/* Right Side */}
      <div className="signup-right">
        <form className="signup-form" onSubmit={handleSignup}>
          <h2>Create your account</h2>

          <div className="field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            disabled={loading}
            type="submit"
            className="signup-btn"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <p className="signin-text">
            Already have an account? <Link to="/auth">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
