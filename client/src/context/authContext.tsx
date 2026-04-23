
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../hooks/auth/useAuthContext";

import { AxiosError } from "axios";

type ErrorResponse = {
  success: false;
  message: string;
};

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  branchId: string | null;
}





export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current user profile
  const { data: userData, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data as User;
    },
    enabled: !!localStorage.getItem("accessToken"),
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  console.log("AuthProvider - userData:", userData);

  // Sync user state with fetched data  



  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: {
      email?: string;
      username?: string;
      password: string;
    }) => {
      const res = await api.post("/auth/login", credentials);
      console.log("Login response:", res);
      return res.data;
    },
    
    onSuccess: (data) => {
      const { user: loggedInUser, accessToken } = data.data;
      localStorage.setItem("accessToken", accessToken);
      console.log("Login successful, user data:", loggedInUser);

      setUser(loggedInUser);

      queryClient.setQueryData(["auth", "me"], loggedInUser);

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        super_admin: "/admin/dashboard",
        branch_admin: "/branch/dashboard",
        store_manager: "/branch/inventory",
        waiter: "/branch/orders",
        cashier: "/branch/orders",
        staff: "/branch/menu",
      };

      const redirectPath = roleRedirects[loggedInUser.role] || "/dashboard";
      navigate(redirectPath);
    },
    onError: (error: unknown) => {
  const err = error as AxiosError<ErrorResponse>;

  const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);

  console.error("Login failed:", message);    },
  });

  console.log(" login mutation state:", loginMutation);

  const login = async (credentials: {
    email?: string;
    username?: string;
    password: string;
  }) => {
    await loginMutation.mutateAsync(credentials);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    queryClient.clear(); // Clear all cached data
    navigate("/login");
  };

  const value: AuthContextType = {
    user,
    error: error,
    isLoading: isLoading || loginMutation.isPending,
    login,
    logout,
    isAuthenticated: !!userData,
    isPending: loginMutation.isPending,
    role: userData?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };
