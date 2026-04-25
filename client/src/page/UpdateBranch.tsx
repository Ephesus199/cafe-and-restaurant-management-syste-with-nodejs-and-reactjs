import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
interface BranchDetails {
    id: string;
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

export default function UpdateBranch() {
    const { id } = useParams();
    const { register, handleSubmit } = useForm<BranchDetails>();
    const navigate = useNavigate();
  
    const getBranchDetails = useQuery({
        queryKey: ["branchDetails", id],
        queryFn: async () => {
            const res = await api.get(`/branches/${id}`);
            return res.data.data;
        }
    });
    const updateBranchMutation = useMutation({
        mutationFn: async (data: BranchDetails) => {
            await api.put(`/branches/${id}`, data);
            console.log("Updating branch with data:", data);
        },
        onSuccess: () => {
            console.log("Branch updated successfully");
            // Optionally, you can refetch the branch details or navigate away after successful update
            navigate('/admin/dashboard', { replace: true });
        },
        onError: (error) => {
            console.error("Failed to update branch:", error);
        }
    })

      function onSubmit(data: BranchDetails) {
        console.log("Update Branch form submitted with data:", data);
          // Implement update branch logic here
          const finalData = { ...data, openingDate: data.openingDate ? new Date(data.openingDate).toISOString() : undefined };
          updateBranchMutation.mutate(finalData);
      }
    if (getBranchDetails.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Update Branch Page</h1>
            {/* Add your update branch form and functionality here */}
            <form onSubmit={handleSubmit(onSubmit)} >
                <div>
                    <label>Branch Name:</label>
                    <input type="text" defaultValue={getBranchDetails.data.name} {...register("name")} />
                </div>
                <div>
                    <label>Branch Code:</label>
                    <input type="text" defaultValue={getBranchDetails.data.branchCode} {...register("branchCode")} />   
                </div>
                <div>
                    <label htmlFor="address">Address:</label>
                    <input type="text" id="address" defaultValue={getBranchDetails.data.address} {...register("address")} />
                </div>
                <div>
                    <label htmlFor="city">City:</label>
                    <input type="text" id="city" defaultValue={getBranchDetails.data.city} {...register("city")} />
                </div>
                <div>
                    <label htmlFor="postalCode">Postal Code:</label>
                    <input type="text" id="postalCode" defaultValue={getBranchDetails.data.postalCode} {...register("postalCode")} />
                </div>
                <div>
                    <label htmlFor="country">Country:</label>   
                    <input type="text" id="country" defaultValue={getBranchDetails.data.country} {...register("country")} />
                </div>
                <div>
                    <label htmlFor="phone">Phone:</label>
                    <input type="text" id="phone" defaultValue={getBranchDetails.data.phone} {...register("phone")} />  
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="text" id="email" defaultValue={getBranchDetails.data.email} {...register("email")} />
                </div>
                <div>
                    <label htmlFor="openingDate">Opening Date:</label>
                    <input type="date" id="openingDate" defaultValue={getBranchDetails.data.openingDate ? new Date(getBranchDetails.data.openingDate).toISOString().split("T")[0] : ""} {...register("openingDate")} />
                </div>
                <div>
                    <label htmlFor="notes">Notes:</label>
                    <textarea id="notes" defaultValue={getBranchDetails.data.notes} {...register("notes")} />
                </div>
                <button type="submit">{ updateBranchMutation.isPending ? "Updating..." : "Update Branch" }</button>
            </form>
        </div>
    )
}