import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  /*
   * ============================================================
   * CHECK AUTH
   * ============================================================
   */

  const checkAuth = async () => {
    try {
      const response =
        await api.get(
          "/auth/check-auth"
        );

      if (
        response.data?.success &&
        response.data?.user
      ) {
        setUser(
          response.data.user
        );
      } else {
        setUser(null);
      }

    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };


  /*
   * ============================================================
   * INITIAL AUTH CHECK
   * ============================================================
   */

  useEffect(() => {
    checkAuth();
  }, []);


  /*
   * ============================================================
   * LOGIN
   * ============================================================
   */

  const login = async ({
    email,
    password,
  }) => {

    if (!email || !password) {
      throw new Error(
        "Email and password are required"
      );
    }

    const response =
      await api.post(
        "/auth/login",
        {
          email: email.trim(),
          password,
        }
      );

    if (
      !response.data?.success
    ) {
      throw new Error(
        response.data?.message ||
        "Login failed"
      );
    }

    setUser(
      response.data.user ||
      null
    );

    return response.data;
  };


  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const logout = async () => {
    try {
      await api.post(
        "/auth/logout"
      );
    } finally {
      setUser(null);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        isAuthenticated:
          !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


/*
 * ============================================================
 * useAuth
 * ============================================================
 */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}