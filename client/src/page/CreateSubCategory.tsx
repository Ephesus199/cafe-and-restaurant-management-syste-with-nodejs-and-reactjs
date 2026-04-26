import { useForm, useFieldArray } from "react-hook-form";
import api from "../api/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const languages = [
  { code: "en", name: "English" },
  { code: "am", name: "አማርኛ (Amharic)" },
  { code: "oro", name: "Oromifa" },
];

type MainCategory = {
  id: string;
  name: string;
};

type FormData = {
  displayOrder: number;
  mainCategoryId: string;
  translations: {
    languageCode: string;
    name: string;
  }[];
};

export default function CreateSubCategory() {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      displayOrder: 0,
      mainCategoryId: "",
      translations: languages.map((lang) => ({
        languageCode: lang.code,
        name: "",
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "translations",
  });

  // Fetch Main Categories
  const getMainCategories = useQuery({
    queryKey: ["mainCategories"],
    queryFn: async () => {
      const res = await api.get("/menu/categories");
      return res.data.data as MainCategory[];
    },
  });

  // Create Mutation
  const createSubCategoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post("/menu/subcategories", {
        displayOrder: data.displayOrder,
        mainCategoryId: data.mainCategoryId,
        translations: data.translations.filter((t) => t.name.trim() !== ""),
      });
    },

    onSuccess: () => {
      reset();
      navigate("/admin/dashboard", {
        replace: true,
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });

  const onSubmit = (data: FormData) => {
    createSubCategoryMutation.mutate(data);
  };

  if (getMainCategories.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Sub-Category</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Category */}
        <div>
          <label className="block mb-2 font-medium">Main Category</label>

          <select
            {...register("mainCategoryId", {
              required: "Select category",
            })}
            className="w-full border p-3 rounded-lg"
          >
            <option value="">Select Main Category</option>

            {getMainCategories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {errors.mainCategoryId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.mainCategoryId.message}
            </p>
          )}
        </div>

        {/* Display Order */}
        <div>
          <label className="block mb-2 font-medium">Display Order</label>

          <input
            type="number"
            {...register("displayOrder", {
              valueAsNumber: true,
              required: "Display order required",
            })}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Translations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Translations</h2>

          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg">
              <label className="block mb-2 font-medium">
                {languages[index].name}
              </label>

              <input
                type="text"
                {...register(`translations.${index}.name`)}
                placeholder={`Enter name in ${languages[index].name}`}
                className="w-full border p-3 rounded-lg"
              />

              {/* Hidden languageCode */}
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
          disabled={createSubCategoryMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {createSubCategoryMutation.isPending
            ? "Creating..."
            : "Create Sub-Category"}
        </button>
      </form>
    </div>
  );
}
