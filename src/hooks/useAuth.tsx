import { createContext, useContext, useState, ReactNode } from "react";
import { Clinician } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextValue {
  clinician: Clinician | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const c = await authService.login(email, password);
      setClinician(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setClinician(null);
  }

  return (
    <AuthContext.Provider value={{ clinician, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
