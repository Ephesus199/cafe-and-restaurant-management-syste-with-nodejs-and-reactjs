import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

type SupplierForm = {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Failed to create supplier. Please try again.";
  }
  const maybe = error as {
    message?: string;
    response?: { data?: { message?: string } };
  };
  return (
    maybe.response?.data?.message ||
    maybe.message ||
    "Failed to create supplier. Please try again."
  );
}

export default function CreateSupplier() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierForm>({
    defaultValues: {
      supplierName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (payload: SupplierForm) => {
      const res = await api.post("/inventory/suppliers", {
        supplierName: payload.supplierName.trim(),
        contactPerson: payload.contactPerson.trim() || undefined,
        phone: payload.phone.trim() || undefined,
        email: payload.email.trim() || undefined,
        address: payload.address.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      reset();
      navigate(from, { replace: true });
    },
  });

  const onSubmit: SubmitHandler<SupplierForm> = async (data) => {
    await createSupplier.mutateAsync(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Supplier
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Register a supplier for inventory purchasing.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Supplier Name
            </label>
            <input
              type="text"
              {...register("supplierName", { required: "Supplier name is required" })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.supplierName && (
              <p className="mt-1 text-sm text-red-500">{errors.supplierName.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Contact Person
            </label>
            <input
              type="text"
              {...register("contactPerson")}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Phone</label>
              <input
                type="text"
                {...register("phone")}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                {...register("email")}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Address</label>
            <textarea
              rows={3}
              {...register("address")}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={createSupplier.isPending}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400"
            >
              {createSupplier.isPending ? "Creating Supplier..." : "Create Supplier"}
            </button>
            {createSupplier.isError && (
              <p className="mt-2 text-sm text-red-500">
                {getErrorMessage(createSupplier.error)}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

