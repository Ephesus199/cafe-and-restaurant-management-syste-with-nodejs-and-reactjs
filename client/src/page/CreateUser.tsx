import { useForm, type SubmitHandler } from "react-hook-form";
import { useAuth } from "../hooks/auth/useAuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
// import api from "../api/axios";
// import axios from "axios";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

interface user {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  branchId?: string;
}

export default function CreateUser() {
    const navigate = useNavigate();
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
        navigate('/admin/dashboard')
    },
    onError: (error) => {
      console.error("Failed to create user:", error);
    },
  });
  const onSubmit: SubmitHandler<user> = async (data: user) => {
    console.log("Form submitted with data:", data);
    await signup.mutateAsync(data);
  };

  console.log("CreateUser - branch data:", branches);
  return (
    <>
      {isLoading ? (
        <p>Loading branches...</p>
      ) : error ? (
        <p className="text-red-500">
          Failed to load branches:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      ) : (
        <div>
          <h1>Create User Page</h1>
          {/* Form to create a new user will go here */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <label htmlFor="fullName">Full Name:</label>
            <input
              type="text"
              id="fullName"
              {...register("fullName", { required: true })}
            />
            {errors.fullName && <span>This field is required</span>}

            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              {...register("username", { required: true })}
            />
            {errors.username && <span>This field is required</span>}
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              {...register("email", { required: true })}
            />
            {errors.email && <span>This field is required</span>}
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              {...register("password", { required: true })}
            />
            {errors.password && <span>This field is required</span>}
            <label htmlFor="role">Role: </label>
            <input
              type="text"
              id="role"
              {...register("role", { required: true })}
            />
            {errors.role && <span>This field is required</span>}
            {role === "super_admin" && (
              <>
                <label htmlFor="branchId">Branch ID: </label>
                <select
                  id="branchId"
                  {...register("branchId", { required: true })}
                >
                  <option value="">Select a branch</option>
                  {branches?.data?.map(
                    (branch: { id: string; name: string }) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ),
                  )}
                </select>
                {errors.branchId && <span>This field is required</span>}
              </>
            )}
            <button type="submit">Create User</button>
          </form>
        </div>
      )}
    </>
  );
}
