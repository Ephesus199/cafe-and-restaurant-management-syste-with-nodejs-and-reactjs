// import { useFormAction } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/auth/useAuthContext";
import { Link } from "react-router-dom";


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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Login
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Welcome back! Please enter your details.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Username</label>
              <input 
                type="text" 
                placeholder="Enter your username"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                {...register("username")} 
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                {...register("password", { required: true })}
              />
              {errors.password && <span className="text-red-500 text-sm mt-1 block">Password is required</span>}
            </div>
            
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Logging in..." : "Login"}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </form>

          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}