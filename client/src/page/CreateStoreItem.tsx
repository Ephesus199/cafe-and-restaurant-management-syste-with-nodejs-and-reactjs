import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

type StoreItemForm = {
  name: string;
  category: string;
  description: string;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to create store item.";
  const maybe = error as { message?: string; response?: { data?: { message?: string } } };
  return maybe.response?.data?.message || maybe.message || "Failed to create store item.";
}

export default function CreateStoreItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StoreItemForm>({
    defaultValues: { name: "", category: "", description: "" },
  });

  const createStoreItem = useMutation({
    mutationFn: async (payload: StoreItemForm) => {
      const res = await api.post("/inventory/store-items", {
        name: payload.name.trim(),
        category: payload.category.trim() || undefined,
        description: payload.description.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      reset();
      navigate(from, { replace: true });
    },
  });

  const onSubmit: SubmitHandler<StoreItemForm> = async (data) => {
    await createStoreItem.mutateAsync(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Store Item
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a base inventory item before creating variants.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              {...register("name", { required: "Store item name is required" })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Category</label>
            <input
              type="text"
              {...register("category")}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              {...register("description")}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={createStoreItem.isPending}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400"
            >
              {createStoreItem.isPending ? "Creating Store Item..." : "Create Store Item"}
            </button>
            {createStoreItem.isError && (
              <p className="mt-2 text-sm text-red-500">
                {getErrorMessage(createStoreItem.error)}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

