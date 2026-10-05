import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "../../styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    user,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * REDIRECT IF ALREADY LOGGED IN
   * ============================================================
   */

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [
    user,
    authLoading,
    navigate,
  ]);


  /*
   * ============================================================
   * LOGIN
   * ============================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setError(
        "Please enter your email"
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password"
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * IMPORTANT:
       * Send ONE object to AuthContext.
       */

      await login({
        email: cleanEmail,
        password: password,
      });

      const from =
        location.state?.from?.pathname ||
        "/dashboard";

      navigate(from, {
        replace: true,
      });

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="login-page">

      <div className="login-card">

        {/* BRAND */}

        <div className="login-brand">

          <div className="login-logo">
            J
          </div>

          <h1>
            Jhalani Enterprises
          </h1>

          <p>
            Inventory Management System
          </p>

        </div>


        {/* HEADING */}

        <div className="login-heading">

          <h2>
            Admin Login
          </h2>

          <p>
            Sign in to access your
            administration panel.
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
        >

          {/* EMAIL */}

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter email"
              autoComplete="username"
              disabled={loading}
            />

          </div>


          {/* PASSWORD */}

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-input">

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                disabled={loading}
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>


          {/* SUBMIT */}

          <button
            className="login-button"
            type="submit"
            disabled={
              loading ||
              authLoading
            }
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>


        {/* FOOTER */}

        <div className="login-footer">
          Jhalani Enterprises
        </div>

      </div>

    </div>
  );
}