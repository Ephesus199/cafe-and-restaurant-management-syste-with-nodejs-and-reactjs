import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface mainCategoryDetails{
    name: string,
    displayOrder: number,
}
export default function CreateCategory() {
    const { register, handleSubmit } = useForm<mainCategoryDetails>();
    const navigate = useNavigate()
    const createCategoryMutation = useMutation({
        mutationFn: async (data: mainCategoryDetails) => {
            await api.post("/menu/categories", data);
            console.log("Creating category with data:", data);
        },
        onSuccess: () => {
            console.log("Category created successfully");
            navigate('/admin/dashboard', { replace: true });
        },
        onError: (error) => {
            console.error("Failed to create category:", error);
        }
    })

    function onSubmit(data: mainCategoryDetails) {
        console.log("Create Category form submitted with data:", data);
        const finalData = { ...data, displayOrder: Number(data.displayOrder) };
        createCategoryMutation.mutate(finalData);
    }
    return (
        <div>
            <h1>Create Category Page</h1>
            {/* Add your create category form and functionality here */}
            <form onSubmit={handleSubmit(onSubmit)} >
                <div>
                    <label>Category Name:</label>
                    <input type="text" {...register("name")} />
                </div>
                <div>
                    <label>Display Order:</label>
                    <input type="number" {...register("displayOrder")} />
                </div>
                <button type="submit">{createCategoryMutation.isPending ? "Creating..." : "Create Category"}</button>
            </form>
        </div>
    )
}