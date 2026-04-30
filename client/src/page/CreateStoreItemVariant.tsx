import { useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

type StoreItem = { id: string; name: string };

type VariantForm = {
  storeItemId: string;
  variantName: string;
  baseUnit: string;
  packUnit: string;
  unitsPerPack: number | "";
  defaultMinStock: number;
  sku: string;
  barcode: string;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to create store item variant.";
  const maybe = error as { message?: string; response?: { data?: { message?: string } } };
  return (
    maybe.response?.data?.message ||
    maybe.message ||
    "Failed to create store item variant."
  );
}

export default function CreateStoreItemVariant() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VariantForm>({
    defaultValues: {
      storeItemId: "",
      variantName: "",
      baseUnit: "",
      packUnit: "",
      unitsPerPack: "",
      defaultMinStock: 0,
      sku: "",
      barcode: "",
    },
  });

  const { data: storeItems, isLoading: isStoreItemsLoading, error: storeItemsError } = useQuery({
    queryKey: ["storeItemsForVariant"],
    queryFn: async () => {
      const res = await api.get("/inventory/store-items");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load store items");
      return (res.data.data as Array<{ id: string; name: string }>).map((item) => ({
        id: item.id,
        name: item.name,
      })) as StoreItem[];
    },
  });

  const createVariant = useMutation({
    mutationFn: async (payload: VariantForm) => {
      const res = await api.post("/inventory/store-item-variants", {
        storeItemId: payload.storeItemId,
        variantName: payload.variantName.trim(),
        baseUnit: payload.baseUnit.trim(),
        packUnit: payload.packUnit.trim() || undefined,
        unitsPerPack:
          payload.unitsPerPack === "" ? undefined : Number(payload.unitsPerPack),
        defaultMinStock: Number(payload.defaultMinStock),
        sku: payload.sku.trim() || undefined,
        barcode: payload.barcode.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      reset();
      navigate(from, { replace: true });
    },
  });

  const onSubmit: SubmitHandler<VariantForm> = async (data) => {
    await createVariant.mutateAsync(data);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Create Store Item Variant
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Define purchasable/trackable units for an existing store item.
        </p>
      </div>

      {isStoreItemsLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
          Loading store items...
        </div>
      ) : storeItemsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          Failed to load store items:{" "}
          {storeItemsError instanceof Error ? storeItemsError.message : "Unknown error"}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Store Item
              </label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Variant Name
                </label>
                <input
                  type="text"
                  {...register("variantName", { required: "Variant name is required" })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.variantName && (
                  <p className="mt-1 text-sm text-red-500">{errors.variantName.message}</p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Base Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. kg, litre, piece"
                  {...register("baseUnit", { required: "Base unit is required" })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.baseUnit && (
                  <p className="mt-1 text-sm text-red-500">{errors.baseUnit.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Pack Unit
                </label>
                <input
                  type="text"
                  placeholder="e.g. box, carton"
                  {...register("packUnit")}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Units Per Pack
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("unitsPerPack", { valueAsNumber: true })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Default Min Stock
                </label>
                <input
                  type="number"
                  min={0}
                  {...register("defaultMinStock", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Min stock cannot be negative" },
                  })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.defaultMinStock && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.defaultMinStock.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">SKU</label>
                <input
                  type="text"
                  {...register("sku")}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Barcode
                </label>
                <input
                  type="text"
                  {...register("barcode")}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={createVariant.isPending}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400"
              >
                {createVariant.isPending
                  ? "Creating Store Item Variant..."
                  : "Create Store Item Variant"}
              </button>
              {createVariant.isError && (
                <p className="mt-2 text-sm text-red-500">
                  {getErrorMessage(createVariant.error)}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

