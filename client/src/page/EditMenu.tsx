import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import api from "../api/axios";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/auth/useAuthContext";


const languages = [
  { code: "en", name: "English" },
  { code: "am", name: "አማርኛ (Amharic)" },
  { code: "oro", name: "Oromifa" },
];

type SubCategory = {
  id: string;
  name: string;
};

type MenuItemFormData = {
  price: number;
  image?: FileList;
  calories?: number;
  preparationTime?: number;
  subcategoryId: string;

  translations: {
    languageCode: string;
    name: string;
    description?: string;
  }[];
};

type ValidationError = {
  field?: string;
  message?: string;
};

type ErrorResponse = {
  message?: string;
  error?: string;
  errors?: ValidationError[];
};

const fieldLabels: Record<string, string> = {
  price: "Price",
  subcategoryId: "Subcategory",
  subcategory: "Subcategory",
  translations: "Menu translations",
  image: "Image",
  calories: "Calories",
  preparationTime: "Preparation time",
};

const friendlyMessageMap: Record<string, string> = {
  "Invalid input: expected array, received string":
    "Menu translations were sent in the wrong format. Please try again.",
  "Invalid input: expected number, received string":
    "One of the number fields has an invalid value.",
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toFriendlyFieldName = (field?: string): string | undefined => {
  if (!field) return undefined;
  return fieldLabels[field] || field;
};

const toFriendlyErrorMessage = (message?: string): string => {
  if (!message) return "Invalid input";
  return friendlyMessageMap[message] || message;
};

export default function EditMenu() {
  const { id } = useParams<{ id: string }>();
  const [imageFile, setImageFile] = useState<FileList | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const location = useLocation();
  const from = location.state?.from || "/dashboard/view-menu";
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isBranchAdmin = user?.role === "branch_admin";
  const isSuperAdmin = user?.role === "super_admin";

  const {
    register,
    control,
    handleSubmit,
    reset,
  } = useForm<MenuItemFormData>({
    defaultValues: {
      price: 0,
      image: undefined,
      calories: 0,
      preparationTime: 0,
      subcategoryId: "",

      translations: languages.map((lang) => ({
        languageCode: lang.code,
        name: "",
        description: "",
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "translations",
  });

  // Fetch subcategories
  const getSubCategories = useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const res = await api.get("/menu/subcategories");
      return res.data.data as SubCategory[];
    },
  });

  // Fetch branch privileges if branch admin
  const getPrivileges = useQuery({
    queryKey: ["branchPrivileges"],
    queryFn: async () => {
      const res = await api.get("/branches/my/privileges");
      return res.data.data;
    },
    enabled: isBranchAdmin,
  });

  // Fetch menu item
  const getMenuItem = useQuery({
    queryKey: ["menuItem", id],
    queryFn: async () => {
      const res = await api.get(`/menu/items/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (getMenuItem.data) {
      const item = getMenuItem.data as Record<string, unknown>;
      
      // Map translations to ensure all languages exist
      const formTranslations = languages.map(lang => {
        const translations = Array.isArray(item.translations)
          ? item.translations
          : [];
        const existingTrans = translations.find(
          (t: { languageCode: string }) => t.languageCode === lang.code,
        );
        return {
          languageCode: lang.code,
          name: existingTrans?.name || "",
          description: existingTrans?.description || "",
        };
      });

      const caloriesValue =
        toOptionalNumber(item.calories) ??
        toOptionalNumber(item.calorie) ??
        toOptionalNumber(item["caloriesValue"]);
      const preparationTimeValue =
        toOptionalNumber(item.preparationTime) ??
        toOptionalNumber(item.preparation_time) ??
        toOptionalNumber(item["prepTime"]);

      reset({
        price: toOptionalNumber(item.price) ?? 0,
        calories: caloriesValue,
        preparationTime: preparationTimeValue,
        subcategoryId: (item.subcategoryId as string) || "",
        translations: formTranslations,
      });
    }
  }, [getMenuItem.data, reset]);

  // Mutation
  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      const hasNewImage = !!(imageFile && imageFile.length > 0);

      if (hasNewImage) {
        const formData = new FormData();
        formData.append("price", data.price.toString());
        formData.append("subcategoryId", data.subcategoryId);
        formData.append("calories", data.calories?.toString() || "0");
        formData.append(
          "preparationTime",
          data.preparationTime?.toString() || "0",
        );
        formData.append("translations", JSON.stringify(data.translations));
        formData.append("image", imageFile![0]);

        return api.patch(`/menu/items/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      return api.patch(`/menu/items/${id}`, {
        ...data,
        image: undefined,
      });
    },

    onSuccess: () => {
      setFormError(null);
      setValidationErrors([]);
      navigate(from, { replace: true });
    },

    onError: (error) => {
      const axiosError = error as AxiosError<ErrorResponse>;
      const responseData = axiosError.response?.data;

      setValidationErrors(
        Array.isArray(responseData?.errors)
          ? responseData.errors.map((entry) => ({
              field: toFriendlyFieldName(entry.field),
              message: toFriendlyErrorMessage(entry.message),
            }))
          : [],
      );
      setFormError(
        toFriendlyErrorMessage(responseData?.message || responseData?.error) ||
          "Failed to update menu item. Please check your inputs and try again.",
      );
    },
  });

  const onSubmit = (data: MenuItemFormData) => {
    setFormError(null);
    setValidationErrors([]);
    updateMenuItemMutation.mutate(data);
  };

  const isLoading = getSubCategories.isLoading || getMenuItem.isLoading || (isBranchAdmin && getPrivileges.isLoading);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-xl font-semibold text-gray-500">Loading...</div>;
  }

  const privileges = getPrivileges.data;
  
  const canEditPrice = isSuperAdmin || (isBranchAdmin && privileges?.canEditPrice);
  const canEditImage = isSuperAdmin || (isBranchAdmin && privileges?.canEditImage);
  const canEditDescription = isSuperAdmin || (isBranchAdmin && privileges?.canEditDescription);
  const canEditCalories = isSuperAdmin || (isBranchAdmin && privileges?.canEditCalories);
  const canEditPreparationTime = isSuperAdmin || (isBranchAdmin && privileges?.canEditPreparationTime);
  const canEditName = isSuperAdmin || (isBranchAdmin && privileges?.canEditName);
  
  // Note: changing subcategoryId usually changes the item completely,
  // we might restrict it if they don't have enough privileges, but for now we keep it editable or only superadmin.
  const canEditSubcategory = isSuperAdmin; 

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Menu Item</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">{formError}</p>
            {validationErrors.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={`${error.field || "error"}-${index}`}>
                    - {error.field ? `${error.field}: ` : ""}
                    {error.message || "Invalid input"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        
        {/* Price */}
        <div>
          <label className="block mb-2">Price</label>
          <input
            type="number"
            step="0.01"
            disabled={!canEditPrice}
            {...register("price", {
              valueAsNumber: true,
              required: "Price required",
            })}
            className={`w-full border p-3 rounded-lg ${!canEditPrice ? 'bg-gray-100 text-gray-500' : ''}`}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block mb-2">Image URL</label>
          {getMenuItem.data?.imageUrl && (
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-1">Current Image:</p>
              <img src={getMenuItem.data.imageUrl} alt="Current" className="h-32 rounded-lg object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            name="image"
            disabled={!canEditImage}
            onChange={(e) => setImageFile(e.target.files)}
            className={`w-full border p-3 rounded-lg ${!canEditImage ? 'bg-gray-100 text-gray-500' : ''}`}
          />
        </div>

        {/* Calories */}
        <div>
          <label className="block mb-2">Calories</label>
          <input
            type="number"
            disabled={!canEditCalories}
            {...register("calories", {
              valueAsNumber: true,
            })}
            className={`w-full border p-3 rounded-lg ${!canEditCalories ? 'bg-gray-100 text-gray-500' : ''}`}
          />
        </div>

        {/* Prep Time */}
        <div>
          <label className="block mb-2">Preparation Time (min)</label>
          <input
            type="number"
            disabled={!canEditPreparationTime}
            {...register("preparationTime", {
              valueAsNumber: true,
            })}
            className={`w-full border p-3 rounded-lg ${!canEditPreparationTime ? 'bg-gray-100 text-gray-500' : ''}`}
          />
        </div>

        {/* Subcategory */}
        <div>
          <label className="block mb-2">Subcategory</label>
          <select
            disabled={!canEditSubcategory}
            {...register("subcategoryId", {
              required: true,
            })}
            className={`w-full border p-3 rounded-lg ${!canEditSubcategory ? 'bg-gray-100 text-gray-500 appearance-none' : ''}`}
          >
            <option value="">Select Subcategory</option>
            {getSubCategories.data?.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Multi Language */}
        <div className="space-y-5">
          <h2 className="text-xl font-semibold">Translations</h2>

          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-xl space-y-3">
              <h3 className="font-semibold">{languages[index].name}</h3>

              <input
                type="text"
                placeholder="Translated Name"
                disabled={!canEditName}
                {...register(`translations.${index}.name`)}
                className={`w-full border p-3 rounded-lg ${!canEditName ? 'bg-gray-100 text-gray-500' : ''}`}
              />

              <textarea
                placeholder="Translated Description"
                disabled={!canEditDescription}
                {...register(`translations.${index}.description`)}
                className={`w-full border p-3 rounded-lg ${!canEditDescription ? 'bg-gray-100 text-gray-500' : ''}`}
              />

              <input
                type="hidden"
                {...register(`translations.${index}.languageCode`)}
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={updateMenuItemMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          {updateMenuItemMutation.isPending
            ? "Updating..."
            : "Update Menu Item"}
        </button>
      </form>
    </div>
  );
}
