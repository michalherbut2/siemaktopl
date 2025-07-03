// frontend/src/hooks/useAuth.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

interface User {
  id: string;
  username: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("discord_token");
    const savedUser = localStorage.getItem("discord_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
    setLoading(false);

    // Handle Expired Tokens (401) Globally
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          console.warn("Token expired or invalid, logging out...");
          setSessionExpired(true);
          logout();
        }
        return Promise.reject(err);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (code: string) => {
    try {
      const response = await axios.post("/auth/discord", { code });
      const { token: newToken, user: newUser } = response.data;
      // console.log("response", response);

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem("discord_token", newToken);
      localStorage.setItem("discord_user", JSON.stringify(newUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    } catch (error) {
      // console.error("Login failed:", error);
      // console.log("Login failed");
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("discord_token");
    localStorage.removeItem("discord_user");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {sessionExpired && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded shadow-lg z-50">
          Sesja wygasła. Proszę się ponownie zalogować.
          <button
            onClick={() => {
              setSessionExpired(false);
              // przekieruj do logowania np.
              // window.location.href = "/login";
            }}
            className="ml-4 underline"
          >
            OK
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
