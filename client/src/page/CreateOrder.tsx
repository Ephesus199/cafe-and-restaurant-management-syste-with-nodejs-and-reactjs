import { useMutation, useQuery } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";

type MainCategory = { id: string; name: string };
type Subcategory = { id: string; name: string; mainCategory?: { id: string } };
type MenuItem = { id: string; name: string; subcategory?: { id: string } };

type OrderItemForm = {
  mainCategoryId: string;
  subcategoryId: string;
  menuItemId: string;
  quantity: number;
  specialInstructions: string;
};

type CreateOrderForm = {
  tableNumber: string;
  kitchenNotes: string;
  customerNotes: string;
  waiterId: string;
  items: OrderItemForm[];
};

const createEmptyOrderItem = (): OrderItemForm => ({
  mainCategoryId: "",
  subcategoryId: "",
  menuItemId: "",
  quantity: 1,
  specialInstructions: "",
});

function getCreateOrderErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to create order. Please try again.";
  const maybeError = error as { message?: string; response?: { data?: { message?: string } } };
  if (maybeError.response?.data?.message) return maybeError.response.data.message;
  if (maybeError.message) return maybeError.message;
  return "Failed to create order. Please try again.";
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const { branchId, role, user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string | { pathname?: string } } | null)?.from;

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitted } } =
    useForm<CreateOrderForm>({
      mode: "onSubmit",
      reValidateMode: "onChange",
      defaultValues: {
        tableNumber: "",
        kitchenNotes: "",
        customerNotes: "",
        waiterId: "",
        items: [createEmptyOrderItem()],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items") ?? [];

  // Waiters must create orders for themselves.
  // We auto-fill `waiterId` so it is always present for backend validation.
  useEffect(() => {
    if (role === "waiter" && user?.id) {
      setValue("waiterId", user.id, { shouldValidate: true });
    }
  }, [role, user?.id, setValue]);

  const { data: mainCategoriesData, isLoading: isMainLoading } = useQuery({
    queryKey: ["mainCategories", "en"],
    queryFn: async () => (await api.get("/menu/categories?lang=en")).data,
    refetchInterval: 3000
  });

  const { data: subcategoriesData, isLoading: isSubLoading } = useQuery({
    queryKey: ["subcategories", "en"],
    queryFn: async () => (await api.get("/menu/subcategories?lang=en")).data,
    refetchInterval:3000
  });

  const { data: menuItemsData, isLoading: isMenuLoading } = useQuery({
    queryKey: ["menuItems", "en", branchId],
    queryFn: async () => {
      const response = await api.get(`/menu/branches/${branchId}/available-menu?lang=en`);
      if (!response.data.success) throw new Error(response.data.message || "Failed to load menu items");
      return response.data;
    },
    enabled: Boolean(branchId),
    refetchInterval: 3000
  });

  const mainCategories: MainCategory[] = mainCategoriesData?.data || [];
  const subcategories: Subcategory[] = subcategoriesData?.data || [];
  const menuItems: MenuItem[] = menuItemsData?.data || [];

  const { data: waitersData, isLoading: isWaitersLoading } = useQuery({
    queryKey: ["waitersForCreateOrder", branchId],
    enabled: role === "cashier" && Boolean(branchId),
    queryFn: async () => {
      const res = await api.get("/users/waiters");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load waiters");
      return res.data.data as Array<{ id: string; fullName: string | null }>;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload: {
      tableNumber?: string;
      kitchenNotes?: string;
      customerNotes?: string;
      waiterId?: string;
      items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
    }) => (await api.post("/orders", payload)).data,
    onSuccess: () => {
      if (typeof from === "string" && from.trim()) {
        navigate(from, { replace: true });
        return;
      }

      if (from && typeof from === "object" && typeof from.pathname === "string") {
        navigate(from.pathname, { replace: true });
        return;
      }

      navigate(-1);
    },
  });

  const onSubmit = async (data: CreateOrderForm) => {
    await createOrderMutation.mutateAsync({
      tableNumber: data.tableNumber.trim() || undefined,
      kitchenNotes: data.kitchenNotes.trim() || undefined,
      customerNotes: data.customerNotes.trim() || undefined,
      waiterId: data.waiterId,
      items: data.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: Number(item.quantity),
        specialInstructions: item.specialInstructions.trim() || undefined,
      })),
    });
  };

  const handleMainCategoryChange = (index: number, value: string) => {
    setValue(`items.${index}.mainCategoryId`, value, { shouldValidate: isSubmitted });
    setValue(`items.${index}.subcategoryId`, "", { shouldValidate: isSubmitted });
    setValue(`items.${index}.menuItemId`, "", { shouldValidate: isSubmitted });
  };

  const handleSubcategoryChange = (index: number, value: string) => {
    setValue(`items.${index}.subcategoryId`, value, { shouldValidate: isSubmitted });
    setValue(`items.${index}.menuItemId`, "", { shouldValidate: isSubmitted });
  };

  const isLoading = isMainLoading || isSubLoading || isMenuLoading;
  const createOrderErrorMessage = createOrderMutation.error
    ? getCreateOrderErrorMessage(createOrderMutation.error)
    : "";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Order</h1>
        <p className="text-sm text-gray-500 mt-1">Add order details and select one or more items.</p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">Loading menu data...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {role === "cashier" && (
              <div>
                <label
                  htmlFor="waiterId"
                  className="block mb-2 text-sm font-semibold text-gray-700"
                >
                  Assign to waiter
                </label>
                {isWaitersLoading ? (
                  <div className="text-sm text-gray-500">Loading waiters...</div>
                ) : (
                  <select
                    id="waiterId"
                    {...register("waiterId", {
                      required: role === "cashier" ? "Please select a waiter" : false,
                    })}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a waiter</option>
                    {(waitersData || []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName || w.id}
                      </option>
                    ))}
                  </select>
                )}
                {errors.waiterId && (
                  <p className="mt-1 text-sm text-red-500">{errors.waiterId.message}</p>
                )}
              </div>
            )}

            {role === "waiter" && (
              <input type="hidden" {...register("waiterId")} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="tableNumber" className="block mb-2 text-sm font-semibold text-gray-700">Table Number</label>
                <input id="tableNumber" type="text" placeholder="e.g. T-12" {...register("tableNumber")}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="customerNotes" className="block mb-2 text-sm font-semibold text-gray-700">Customer Notes</label>
                <input id="customerNotes" type="text" placeholder="Optional customer request" {...register("customerNotes")}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label htmlFor="kitchenNotes" className="block mb-2 text-sm font-semibold text-gray-700">Kitchen Notes</label>
              <textarea id="kitchenNotes" rows={3} placeholder="Optional kitchen notes" {...register("kitchenNotes")}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                <button type="button" onClick={() => append(createEmptyOrderItem())}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Add order item
                </button>
              </div>

              {fields.map((field, index) => {
                const selectedMainCategoryId = items[index]?.mainCategoryId ?? "";
                const selectedSubcategoryId = items[index]?.subcategoryId ?? "";
                const filteredSubcategories = subcategories.filter((sub) => sub.mainCategory?.id === selectedMainCategoryId);
                const filteredMenuItems = menuItems.filter((menuItem) => menuItem.subcategory?.id === selectedSubcategoryId);

                return (
                  <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Item #{index + 1}</h3>
                      <button type="button" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length === 1}
                        className="text-sm font-medium text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed">Remove</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Main Category</label>
                        <select value={selectedMainCategoryId} onChange={(e) => handleMainCategoryChange(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                          <option value="">Select main category</option>
                          {mainCategories.map((mainCategory) => <option key={mainCategory.id} value={mainCategory.id}>{mainCategory.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Subcategory</label>
                        <select value={selectedSubcategoryId} onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                          disabled={!selectedMainCategoryId}
                          className="w-full border border-gray-300 rounded-lg p-3 bg-white disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                          <option value="">Select subcategory</option>
                          {filteredSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Menu Item</label>
                        <select {...register(`items.${index}.menuItemId`, { required: "Menu item is required" })} disabled={!selectedSubcategoryId}
                          className="w-full border border-gray-300 rounded-lg p-3 bg-white disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Select menu item</option>
                          {filteredMenuItems.map((menuItem) => <option key={menuItem.id} value={menuItem.id}>{menuItem.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Quantity</label>
                        <input type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Special Instructions</label>
                        <input type="text" placeholder="Optional" {...register(`items.${index}.specialInstructions`)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                    </div>

                    <input type="hidden" {...register(`items.${index}.mainCategoryId`, { required: true })} />
                    <input type="hidden" {...register(`items.${index}.subcategoryId`, { required: true })} />
                    {errors.items?.[index] && (
                      <p className="text-sm text-red-500">Please select main category, subcategory, and menu item.</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <button type="submit" disabled={createOrderMutation.isPending}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors">
                {createOrderMutation.isPending ? "Creating Order..." : "Create Order"}
              </button>
              {createOrderMutation.isError && <p className="mt-2 text-sm text-red-500">{createOrderErrorMessage}</p>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

