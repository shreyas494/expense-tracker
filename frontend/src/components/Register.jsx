import React, { useState } from 'react'
import { loginStyles } from '../assets/dummyStyles'
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const Register = ({ onRegister, API_URL = "http://localhost:4000" }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_URL}/api/user/register`,
        { name, email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data || {};
      const token = data.token || null;
      const profile = data.user || { name, email };

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(profile));
      }

      if (typeof onRegister === "function") {
        onRegister(profile, token);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Registration error:", err?.response || err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        "Registration failed";
      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className={loginStyles.headerTitle}>Create Account</h1>
          <p className={loginStyles.headerSubtitle}>
            Sign up to start tracking your expenses
          </p>
        </div>

        <div className={loginStyles.formContainer}>
          {error && (
            <div className={loginStyles.errorContainer}>
              <div className={loginStyles.errorIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className={loginStyles.errorText}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className={loginStyles.label}>
                Full Name
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={loginStyles.input}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={loginStyles.label}>
                Email address
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={loginStyles.input}
                  placeholder="your@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={loginStyles.label}>
                Password (min. 8 characters)
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={loginStyles.paswordinput}
                  placeholder="******"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={loginStyles.passwordToggle}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={loginStyles.submitButton}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className={loginStyles.footerText}>
            Already have an account?
            <Link to="/login" className={loginStyles.footerLink}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
