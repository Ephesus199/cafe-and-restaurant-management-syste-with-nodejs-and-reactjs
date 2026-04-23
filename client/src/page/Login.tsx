// import { useFormAction } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/auth/useAuthContext";


type inputType = { email?: string; username?: string; password: string };
export function Login() {

  const { register, handleSubmit, formState: { errors } } = useForm<inputType>()
  const {login,error, isPending} = useAuth();

  const onSubmit: SubmitHandler<inputType> =async (data) => {
    // e.preventDefault();
   try {
     await login(data);
     console.log("Login finished", data);
   } catch (err) {
     console.error("Submit error", err);
   }
  };
 
  return (
    <div>
      <h1>Login Page</h1>
      {/* Add your login form here */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* <div>
          <label>Email:</label>
          <input type="email" {...register("email")} />
        </div> */}
        <div>
          <label>Username:</label>
          <input type="text" {...register("username")} />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            {...register("password", { required: true })}
          />
          {errors.password && <span>Password is required</span>}
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? "Logging in..." : "Login"}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
}