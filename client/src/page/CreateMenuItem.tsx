import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useState } from "react";

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
  //   name: string;
  price: number;
  image?: FileList;
  //   description?: string;
  calories?: number;
  preparationTime?: number;
  subcategoryId: string;
  //   defaultAvailable: boolean;

  translations: {
    languageCode: string;
    name: string;
    description?: string;
  }[];
};

export default function CreateMenuItem() {
    const [imageFile, setImageFile] = useState<FileList | null>(null);
    const location = useLocation();
    console.log("Location state:", location);
    const from = location.state?.from || "/";
    console.log("from value:", from);
  console.log("Selected image file:", imageFile);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    reset,
    // setValue
    // formState: { errors },
  } = useForm<MenuItemFormData>({
    defaultValues: {
      //   name: "",
      price: 0,
      image: undefined,
      //   description: "",
      calories: 0,
      preparationTime: 0,
      subcategoryId: "",
      //   defaultAvailable: true,

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

  // Mutation
  const createMenuItemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post("/menu/items", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },

    onSuccess: () => {
      reset();
      navigate(from, {
        replace: true,
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });

  const onSubmit = (data: MenuItemFormData) => {
    const formData = new FormData();

    formData.append("price", data.price.toString());
    formData.append("subcategoryId", data.subcategoryId);
    formData.append("calories", data.calories?.toString() || "0");
    formData.append("preparationTime", data.preparationTime?.toString() || "0");
    formData.append("translations", JSON.stringify(data.translations));
    if (imageFile && imageFile.length > 0) {
      formData.append("image", imageFile[0]);
    }

    //   const formData = {...data, image: imageFile && imageFile.length > 0 ? imageFile : undefined};
    // formData.append("defaultAvailable", data.defaultAvailable.toString());
    console.log("Form Data:", formData);
    createMenuItemMutation.mutate(formData);
  };

  if (getSubCategories.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Menu Item</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Default Name */}
        {/* <div>
          <label className="block mb-2">Default Name</label>

          <input
            type="text"
            {...register("name", {
              required: "Name required",
            })}
            className="w-full border p-3 rounded-lg"
          />

          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div> */}

        {/* Price */}
        <div>
          <label className="block mb-2">Price</label>

          <input
            type="number"
            step="0.01"
            {...register("price", {
              valueAsNumber: true,
              required: "Price required",
            })}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Description */}
        {/* <div>
          <label className="block mb-2">Description</label>

          <textarea
            {...register("description")}
            className="w-full border p-3 rounded-lg"
          />
        </div> */}

        {/* Image URL */}
        <div>
          <label className="block mb-2">Image URL</label>

          <input
            type="file"
            accept="image/*"
            name="image"
            onChange={(e) => setImageFile(e.target.files)}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Calories */}
        <div>
          <label className="block mb-2">Calories</label>

          <input
            type="number"
            {...register("calories", {
              valueAsNumber: true,
            })}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Prep Time */}
        <div>
          <label className="block mb-2">Preparation Time (min)</label>

          <input
            type="number"
            {...register("preparationTime", {
              valueAsNumber: true,
            })}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Subcategory */}
        <div>
          <label className="block mb-2">Subcategory</label>

          <select
            {...register("subcategoryId", {
              required: true,
            })}
            className="w-full border p-3 rounded-lg"
          >
            <option value="">Select Subcategory</option>

            {getSubCategories.data?.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Availability */}
        {/* <div className="flex items-center gap-2">
          <input type="checkbox" {...register("defaultAvailable")} />

          <label>Available by Default</label>
        </div> */}

        {/* Multi Language */}
        <div className="space-y-5">
          <h2 className="text-xl font-semibold">Translations</h2>

          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-xl space-y-3">
              <h3 className="font-semibold">{languages[index].name}</h3>

              <input
                type="text"
                placeholder="Translated Name"
                {...register(`translations.${index}.name`)}
                className="w-full border p-3 rounded-lg"
              />

              <textarea
                placeholder="Translated Description"
                {...register(`translations.${index}.description`)}
                className="w-full border p-3 rounded-lg"
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
          disabled={createMenuItemMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {createMenuItemMutation.isPending
            ? "Creating..."
            : "Create Menu Item"}
        </button>
      </form>
    </div>
  );
}
