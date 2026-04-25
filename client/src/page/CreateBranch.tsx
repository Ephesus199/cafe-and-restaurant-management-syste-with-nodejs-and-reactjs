import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import api from "../api/axios";

interface branchInfo{
    name: string;
    branchCode: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    openingDate?: string;
    notes?: string;
}
export default function CreateBranch() {
    const { register, handleSubmit } = useForm<branchInfo>();

    const createBranchMutation = useMutation({
        mutationFn: async (data: branchInfo) => {
            // Implement create branch API call here
                await api.post("/branches", data);
            console.log("Creating branch with data:", data);
        }
    });

    function onSubmit(data: branchInfo) {
        console.log("Create Branch form submitted with data:", data);
        // Implement create branch logic here
        const finalData = { ...data, openingDate: data.openingDate ? new Date(data.openingDate).toISOString() : undefined };
        console.log("Final data being sent to API:", finalData);
        createBranchMutation.mutate(finalData);
    }
    return (
        <div>
            <h1>Create Branch Page</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label>Branch Name:</label>
                    <input type="text" {...register("name")} />
                </div>
                <div>
                    <label>Branch Code:</label>
                    <input type="text" {...register("branchCode")} />
                </div>
                <div>
                    <label htmlFor="address">Address:</label>
                    <input type="text" id="address" {...register("address")} />
                </div>
                <div>
                    <label htmlFor="city">City:</label>
                    <input type="text" id="city" {...register("city")} />
                </div>
                <div>
                    <label htmlFor="postalCode">Postal Code:</label>
                    <input type="text" id="postalCode" {...register("postalCode")} />
                </div>
                <div>
                    <label htmlFor="country">Country:</label>
                    <input type="text" id="country" {...register("country")} />
                </div>
                <div>
                    <label htmlFor="phone">Phone:</label>
                    <input type="text" id="phone" {...register("phone")} />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" {...register("email")} />
                </div>
                <div>
                    <label htmlFor="openingDate">Opening Date:</label>
                    <input type="date" id="openingDate" {...register("openingDate")} />
                </div>
                <div>
                    <label htmlFor="notes">Notes:</label>
                    <textarea id="notes" {...register("notes")} />
                </div>
                <button type="submit">Create Branch</button>
            </form>
        </div>
    )
}