import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, clearToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [company, setCompany] = useState(null);
  // "loading" tant qu'on n'a pas vérifié si un jeton existant est encore valide
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setCompany(data))
      .catch(() => {
        clearToken();
        setCompany(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setCompany(data.company);
    return data.company;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    setToken(data.token);
    setCompany(data.company);
    return data.company;
  }, []);

  const logout = useCallback(() => {
    api.logout().catch(() => {});
    clearToken();
    setCompany(null);
  }, []);

  return (
    <AuthContext.Provider value={{ company, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
