import { useForm, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";



const languages = [
  { code: "en", name: "English" },
  { code: "am", name: "አማርኛ (Amharic)" },
  { code: "oro", name: "Oromifa" },
];

type FormData = {
  displayOrder: number;
  translations: {
    languageCode: string;
    name: string;
  }[];
};

export default function CreateMainCategory() {
  const { register, control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      displayOrder: 0,
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

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
       await api.post("/menu/categories", {
        displayOrder: data.displayOrder,
        translations: data.translations.filter((t) => t.name.trim() !== ""),
      });
    },
    onSuccess: () => {
      alert("Created Successfully");
      reset();
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Main Category</h1>

      {/* Display Order */}
      <div className="mb-6">
        <label className="block mb-2">Display Order</label>

        <input
          type="number"
          {...register("displayOrder", {
            valueAsNumber: true,
          })}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* Translations */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Translations</h2>

        {fields.map((field, index) => (
          <div key={field.id} className="border p-4 rounded-lg">
            <label className="block mb-2">{languages[index].name}</label>

            <input
              type="text"
              {...register(`translations.${index}.name`)}
              placeholder={`Enter name in ${languages[index].name}`}
              className="w-full p-3 border rounded-lg"
            />

            {/* hidden language code */}
            <input
              type="hidden"
              {...register(`translations.${index}.languageCode`)}
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        {createMutation.isPending ? "Creating..." : "Create Main Category"}
      </button>
    </form>
  );
}
