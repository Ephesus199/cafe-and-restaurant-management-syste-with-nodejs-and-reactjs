import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/auth/useAuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
// import api from "../api/axios";
// import axios from "axios";
import api from "../api/axios";
import { useLocation, useNavigate } from "react-router-dom";

interface user {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  branchId?: string;
}

function getCreateUserErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Failed to create user. Please try again.";
  }

  const maybeError = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: string[] | Record<string, string[] | string>;
      };
    };
  };

  const responseData = maybeError.response?.data;

  if (typeof responseData?.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === "string" && responseData.error.trim()) {
    return responseData.error;
  }

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors.join(", ");
  }

  if (
    responseData?.errors &&
    typeof responseData.errors === "object" &&
    !Array.isArray(responseData.errors)
  ) {
    const flattenedMessages = Object.values(responseData.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    if (flattenedMessages.length > 0) {
      return flattenedMessages.join(", ");
    }
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim()) {
    return maybeError.message;
  }

  return "Failed to create user. Please try again.";
}

export default function CreateUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<user>();
  // const [queryError, setQueryError] = useState<string | null>(null);
  const { role } = useAuth();
  const {
    data: branches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      return res.data;
    },
  });

  const signup = useMutation({
    mutationFn: async (newUserData: user) => {
   
          const res = await api.post("/users", newUserData);
            
       
        return res.data;
    
    },

    onSuccess: () => {
        console.log("User created successfully");
        navigate(from, { replace: true });
    },
    onError: (error) => {
      console.error("Failed to create user:", error);
    },
  });
  const onSubmit: SubmitHandler<user> = async (data: user) => {
    console.log("Form submitted with data:", data);
    await signup.mutateAsync(data);
  };
  const createUserErrorMessage = signup.error
    ? getCreateUserErrorMessage(signup.error)
    : "";

  console.log("CreateUser - branch data:", branches);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create User
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a new team member and assign the right role.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
          Loading branches...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          Failed to load branches:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div>
              <label
                htmlFor="fullName"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                placeholder="Enter full name"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("fullName", { required: true })}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">This field is required.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter username"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("username", { required: true })}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">This field is required.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter email address"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("email", { required: true })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">This field is required.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("password", { required: true })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">This field is required.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="role"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Role
              </label>
              <input
                type="text"
                id="role"
                placeholder="e.g. cashier, manager"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register("role", { required: true })}
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">This field is required.</p>
              )}
            </div>

            {role === "super_admin" && (
              <div>
                <label
                  htmlFor="branchId"
                  className="block mb-2 text-sm font-semibold text-gray-700"
                >
                  Branch
                </label>
                <select
                  id="branchId"
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("branchId", { required: true })}
                >
                  <option value="">Select a branch</option>
                  {branches?.data?.map((branch: { id: string; name: string }) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="mt-1 text-sm text-red-500">This field is required.</p>
                )}
              </div>
            )}

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={signup.isPending}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {signup.isPending ? "Creating User..." : "Create User"}
              </button>
              {signup.isError && (
                <p className="mt-2 text-sm text-red-500">
                  {createUserErrorMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
