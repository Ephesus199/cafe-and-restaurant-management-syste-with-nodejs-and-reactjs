import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/auth/useAuthContext";
import api from "../api/axios";

type Supplier = { id: string; supplierName: string };
type StoreItem = {
  id: string;
  name: string;
  variants: Array<{ id: string; variantName: string; baseUnit: string }>;
};

type PurchaseItemForm = {
  storeItemId: string;
  variantId: string;
  quantityPurchased: number;
  unitPrice: number;
  packPrice?: number;
};

type PurchaseBatchForm = {
  supplierId: string;
  purchaseDate: string;
  invoiceNumber: string;
  notes: string;
  items: PurchaseItemForm[];
};

const buildTodayISO = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to create purchase.";
  const maybe = error as { message?: string; response?: { data?: { message?: string } } };
  return maybe.response?.data?.message || maybe.message || "Failed to create purchase.";
}

export default function CreatePurchaseBatch() {
  const { branchId } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PurchaseBatchForm>({
    defaultValues: {
      supplierId: "",
      purchaseDate: buildTodayISO(),
      invoiceNumber: "",
      notes: "",
      items: [{ storeItemId: "", variantId: "", quantityPurchased: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  const { data: suppliers } = useQuery({
    queryKey: ["inventorySuppliersForPurchase"],
    queryFn: async () => {
      const res = await api.get("/inventory/suppliers");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load suppliers");
      return res.data.data as Supplier[];
    },
  });

  const { data: storeItems } = useQuery({
    queryKey: ["inventoryStoreItemsForPurchase"],
    queryFn: async () => {
      const res = await api.get("/inventory/store-items");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load store item variants");
      return res.data.data as StoreItem[];
    },
  });

  const storeItemOptions = storeItems || [];

  const createPurchaseMutation = useMutation({
    mutationFn: async (payload: PurchaseBatchForm) => {
      if (!branchId) throw new Error("No branch is assigned to the current user.");
      const res = await api.post(`/inventory/branches/${branchId}/purchases`, {
        supplierId: payload.supplierId || undefined,
        purchaseDate: new Date(`${payload.purchaseDate}T00:00:00`).toISOString(),
        invoiceNumber: payload.invoiceNumber.trim() || undefined,
        notes: payload.notes.trim() || undefined,
        items: payload.items.map((item) => ({
          storeItemId: item.storeItemId,
          variantId: item.variantId,
          quantityPurchased: Number(item.quantityPurchased),
          unitPrice: Number(item.unitPrice),
          ...(item.packPrice ? { packPrice: Number(item.packPrice) } : {}),
        })),
      });
      return res.data;
    },
    onSuccess: () => {
      reset({
        supplierId: "",
        purchaseDate: buildTodayISO(),
        invoiceNumber: "",
        notes: "",
        items: [{ storeItemId: "", variantId: "", quantityPurchased: 1, unitPrice: 0 }],
      });
    },
  });

  const totalCostPreview = (watchedItems || []).reduce((sum, item) => {
    const qty = Number(item.quantityPurchased || 0);
    const price = Number(item.unitPrice || 0);
    return sum + qty * price;
  }, 0);

  const onSubmit: SubmitHandler<PurchaseBatchForm> = async (data) => {
    await createPurchaseMutation.mutateAsync(data);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Purchase</h1>
        <p className="text-sm text-gray-500 mt-1">
          Store managers can submit multiple inventory items in one purchase request.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Purchase Date</label>
              <input
                type="date"
                {...register("purchaseDate", { required: "Purchase date is required" })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-sm text-red-500">{errors.purchaseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Supplier</label>
              <select
                {...register("supplierId")}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Optional supplier</option>
                {(suppliers || []).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Invoice Number</label>
              <input
                type="text"
                {...register("invoiceNumber")}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              rows={3}
              {...register("notes")}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional purchase notes"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Purchase Items</h2>
              <button
                type="button"
                onClick={() =>
                  append({
                    storeItemId: "",
                    variantId: "",
                    quantityPurchased: 1,
                    unitPrice: 0,
                    packPrice: undefined,
                  })
                }
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                {(() => {
                  const selectedStoreItemId = watchedItems?.[index]?.storeItemId || "";
                  const selectedStoreItem = storeItemOptions.find((item) => item.id === selectedStoreItemId);
                  const selectedVariants = selectedStoreItem?.variants || [];
                  return (
                    <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Item #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length === 1}
                    className="text-sm font-medium text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Store Item</label>
                    <select
                      {...register(`items.${index}.storeItemId`, { required: "Store item is required" })}
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select store item</option>
                      {storeItemOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.storeItemId && (
                      <p className="mt-1 text-sm text-red-500">{errors.items[index]?.storeItemId?.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Variant</label>
                    <select
                      {...register(`items.${index}.variantId`, { required: "Variant is required" })}
                      disabled={!selectedStoreItemId}
                      className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select variant</option>
                      {selectedVariants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.variantName} ({variant.baseUnit})
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.variantId && (
                      <p className="mt-1 text-sm text-red-500">{errors.items[index]?.variantId?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      {...register(`items.${index}.quantityPurchased`, {
                        valueAsNumber: true,
                        min: { value: 0.01, message: "Quantity must be greater than 0" },
                      })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                        min: { value: 0.01, message: "Unit price must be greater than 0" },
                      })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm font-semibold text-blue-800">
            Total cost preview: {Number.isFinite(totalCostPreview) ? totalCostPreview.toFixed(2) : "0.00"}
          </div>

          <div>
            <button
              type="submit"
              disabled={createPurchaseMutation.isPending}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {createPurchaseMutation.isPending ? "Submitting Purchase..." : "Submit Purchase"}
            </button>
            {createPurchaseMutation.isSuccess && (
              <p className="mt-2 text-sm text-green-600">Purchase request submitted successfully.</p>
            )}
            {createPurchaseMutation.isError && (
              <p className="mt-2 text-sm text-red-500">{getErrorMessage(createPurchaseMutation.error)}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
