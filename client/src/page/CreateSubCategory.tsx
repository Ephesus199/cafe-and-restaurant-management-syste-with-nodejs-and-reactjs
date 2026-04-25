import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface SubCategoryDetails {
    name: string;
    displayOrder: number;
    mainCategoryId: string;
}
export default function CreateSubCategory() {
    const { register, handleSubmit } = useForm<SubCategoryDetails>();
    const navigate = useNavigate();
    const getMainCategories = useQuery({
        queryKey: ["mainCategories"],
        queryFn: async () => {
            const res = await api.get("/menu/categories");
            return res.data.data;
        }
    });

        const createSubCategoryMutation = useMutation({
          mutationFn: async (data: SubCategoryDetails) => {
            await api.post("/menu/subcategories", data);
            console.log("Creating sub-category with data:", data);
          },
          onSuccess: () => {
            console.log("Sub-Category created successfully");
            navigate("/admin/dashboard", { replace: true });
          },
          onError: (error) => {
            console.error("Failed to create sub-category:", error);
          },
        });
    function onSubmit(data: SubCategoryDetails) {
        console.log("Create Sub-Category form submitted with data:", data);
        // Implement create sub-category logic here
        const finalData = { ...data, displayOrder: Number(data.displayOrder) };
        createSubCategoryMutation.mutate(finalData);
    }

    if (getMainCategories.isLoading) {
        return (
            <div>Loading...</div>
        )
    }
    return (
        <div>
            <h1>Create Sub-Category Page</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label>Sub-Category Name:</label>
                    <input type="text" {...register("name")} />
                </div>
                <div>
                    <label>Display Order:</label>
                    <input type="number" {...register("displayOrder")} />
                </div>
                <div>
                    <label>Main Category:</label>
                    <select {...register("mainCategoryId")}>
                        <option value="">Select a main category</option>
                        {getMainCategories.data?.map((category: { id: string; name: string }) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit">{createSubCategoryMutation.isPending ? "Creating..." : "Create Sub-Category"}</button>
            </form>
        </div>
    )
}