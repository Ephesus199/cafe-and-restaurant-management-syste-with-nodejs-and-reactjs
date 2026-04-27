import { createContext, useContext } from "react";
import type { User } from "../../context/authContext";
export interface AuthContextType {
    user: User | null;
    error:string | null;
    isLoading: boolean;
    isPending?: boolean;
    role: string | null;
  login: (credentials: {
    email?: string;
    username?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};