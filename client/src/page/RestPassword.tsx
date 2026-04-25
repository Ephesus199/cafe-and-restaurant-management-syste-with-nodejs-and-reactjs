import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
interface resetInfo{
    newPassword: string;
    confirmNewPassword: string;
}

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token") || "";
    const navigate = useNavigate()
    
    const { register, handleSubmit } = useForm<resetInfo>();

    const resetPasswordMutation = useMutation({
        mutationFn: async (data: resetInfo) => {
            // Implement reset password API call here
            await api.post("/auth/reset-password", data);
            console.log("Resetting password with data:", data);
        },
        onSuccess: () => {
            console.log("Password reset successful");
            navigate('/login', { replace: true });
        },
        onError: (error) => {
            console.error("Failed to reset password:", error);
        }   
    });
    function onSubmit(data: resetInfo) {
        const finalData = { ...data, token };
        console.log("Reset Password form submitted with data:", finalData);
        
        resetPasswordMutation.mutate(finalData);
        // Implement reset password logic here

    }
    return (
        <div>
            <h1>Reset Password Page</h1>
            {/* Add your reset password form here */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label>New Password:</label>
                    <input type="password" {...register("newPassword")} />
                </div>
                <div>
                    <label>Confirm Password:</label>
                    <input type="password" {...register("confirmNewPassword")} />
                </div>
                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
}