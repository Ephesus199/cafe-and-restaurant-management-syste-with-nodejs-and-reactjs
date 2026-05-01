import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface ResetInfo {
  newPassword: string;
  confirmNewPassword: string;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetInfo>();

  const newPassword = watch("newPassword");

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetInfo) => {
      await api.post("/auth/reset-password", { ...data, token });
    },
    onSuccess: () => {
      navigate("/login", { replace: true });
    },
  });

  function onSubmit(data: ResetInfo) {
    resetPasswordMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Set a new password for your account.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-500">
                Invalid or missing reset token. Please request a new reset link.
              </p>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Go to Forgot Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  {...register("confirmNewPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === newPassword || "Passwords do not match",
                  })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {errors.confirmNewPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmNewPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </button>

              {resetPasswordMutation.isError && (
                <p className="text-sm text-red-500 text-center">
                  Failed to reset password. Please try again.
                </p>
              )}
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}