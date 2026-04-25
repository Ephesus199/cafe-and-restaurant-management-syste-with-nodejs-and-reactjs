import { useForm } from "react-hook-form"
import api from "../api/axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useState } from "react";

interface changePasswordInfo {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}
interface ApiErrorResponse {
    sucess: boolean;
    message: string;
}
export default function ChangePassword() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate()
    const { register, handleSubmit } = useForm<changePasswordInfo>();
    const changePasswordMutation = useMutation({
        mutationFn: async (data: changePasswordInfo) => {
            // Implement change password API call here
            await api.post("/auth/change-password", data);
            console.log("Changing password with data:", data);
        },
        onSuccess: () => {
            console.log("Password changed successfully");
            // Optionally, you can log the user out or redirect them after a successful password change
            navigate("/login", { replace: true });
        },
        onError: (error) => {
            const apiError = error as AxiosError<ApiErrorResponse>;
            setError(apiError.response?.data?.message || "Failed to change password.");
            }
    });
    function onSubmit(data: changePasswordInfo) {
        console.log("Change Password form submitted with data:", data);
        changePasswordMutation.mutate(data);
    }
    return (
        <div>
            <h1>Change Password Page</h1>
            {/* Add your change password form here */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label>Current Password:</label>
                    <input type="password" {...register("currentPassword")} />
                </div>
                <div>
                    <label>New Password:</label>
                    <input type="password" {...register("newPassword")} />
                </div>
                <div>
                    <label>Confirm New Password:</label>
                    <input type="password" {...register("confirmNewPassword")} />
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
                </button>
            </form>
        </div>
    )
}