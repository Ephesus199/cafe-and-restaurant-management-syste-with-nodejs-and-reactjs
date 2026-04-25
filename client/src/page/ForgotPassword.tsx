import { useMutation } from "@tanstack/react-query";

import { useForm } from "react-hook-form";
import api from "../api/axios";

export default function ForgotPassword() {
    const { register, handleSubmit } = useForm<{ email: string }>();

    const forgotPassword = useMutation({
        mutationFn: async (email: string) => {
            await api.post("/auth/forgot-password", { email });
            // Implement forgot password API call here
        }
    });

    const onSubmit = (data: { email: string }) => {
        console.log("Forgot Password form submitted with data:", data);
        forgotPassword.mutate(data.email);
    // Implement forgot password logic here
  };
  return (
    <div>
      <h1>Forgot Password Page</h1>
          {/* Add your forgot password form here */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label>Email:</label>
              <input type="email" {...register("email")} />
            </div>
            <button type="submit">Send Reset Link</button>
          </form>
    </div>
  );
}