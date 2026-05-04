import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";
import BranchStaffSubnav from "../component/BranchStaffSubnav";

type StoreItem = {
  id: string;
  name: string;
  variants: Array<{ id: string; variantName: string; baseUnit: string }>;
};

type DailyUsageForm = {
  usageDate: string;
  storeItemId: string;
  variantId: string;
  quantityUsed: number;
  notes: string;
};

const buildTodayISO = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to record usage.";
  const maybe = error as { message?: string; response?: { data?: { message?: string } } };
  return maybe.response?.data?.message || maybe.message || "Failed to record usage.";
}

export default function RecordDailyUsage() {
  const { branchId } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DailyUsageForm>({
    defaultValues: {
      usageDate: buildTodayISO(),
      storeItemId: "",
      variantId: "",
      quantityUsed: 0.01,
      notes: "",
    },
  });

  const storeItemId = watch("storeItemId");

  const { data: storeItems } = useQuery({
    queryKey: ["storeItemsForDailyUsage"],
    queryFn: async () => {
      const res = await api.get("/inventory/store-items");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load store items");
      return res.data.data as StoreItem[];
    },
  });

  const selectedStoreItem = storeItems?.find((s) => s.id === storeItemId);
  const variants = selectedStoreItem?.variants ?? [];

  useEffect(() => {
    setValue("variantId", "");
  }, [storeItemId, setValue]);

  const mutation = useMutation({
    mutationFn: async (payload: DailyUsageForm) => {
      if (!branchId) throw new Error("No branch assigned.");
      const res = await api.post(`/inventory/branches/${branchId}/usage`, {
        variantId: payload.variantId,
        usageDate: new Date(`${payload.usageDate}T12:00:00`).toISOString(),
        quantityUsed: Number(payload.quantityUsed),
        notes: payload.notes.trim() || undefined,
      });
      if (!res.data.success) throw new Error(res.data.message || "Failed to record usage");
      return res.data;
    },
    onSuccess: () => {
      reset({
        usageDate: buildTodayISO(),
        storeItemId: "",
        variantId: "",
        quantityUsed: 0.01,
        notes: "",
      });
    },
  });

  const onSubmit: SubmitHandler<DailyUsageForm> = async (data) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BranchStaffSubnav />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Record daily usage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Log how much of each variant was used on a given day.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Usage date</label>
            <input
              type="date"
              {...register("usageDate", { required: "Date is required" })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.usageDate && (
              <p className="mt-1 text-sm text-red-500">{errors.usageDate.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Store item</label>
            <select
              {...register("storeItemId", { required: "Store item is required" })}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select store item</option>
              {(storeItems || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.storeItemId && (
              <p className="mt-1 text-sm text-red-500">{errors.storeItemId.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Variant</label>
            <select
              {...register("variantId", { required: "Variant is required" })}
              disabled={!storeItemId}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select variant</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.variantName} ({v.baseUnit})
                </option>
              ))}
            </select>
            {errors.variantId && (
              <p className="mt-1 text-sm text-red-500">{errors.variantId.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Quantity used</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              {...register("quantityUsed", {
                valueAsNumber: true,
                min: { value: 0.01, message: "Quantity must be greater than 0" },
              })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quantityUsed && (
              <p className="mt-1 text-sm text-red-500">{errors.quantityUsed.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              rows={3}
              {...register("notes")}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Saving..." : "Record usage"}
            </button>
            {mutation.isSuccess && (
              <p className="mt-2 text-sm text-green-600">Usage recorded successfully.</p>
            )}
            {mutation.isError && (
              <p className="mt-2 text-sm text-red-500">{getErrorMessage(mutation.error)}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
