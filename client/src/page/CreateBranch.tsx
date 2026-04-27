import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useNavigate } from "react-router";

interface branchInfo {
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
    privileges?: {
        canEditName: boolean;
        canEditPrice: boolean;
        canEditImage: boolean;
        canEditDescription: boolean;
        canEditCalories: boolean;
        canEditPreparationTime: boolean;
    };
}

export default function CreateBranch() {
    const { register, handleSubmit } = useForm<branchInfo>();
    const navigate = useNavigate();

    const createBranchMutation = useMutation({
        mutationFn: async (data: branchInfo) => {
            await api.post("/branches", data);
            console.log("Creating branch with data:", data);
        },
        onSuccess: () => {
            console.log("Branch created successfully");
            navigate('/admin/dashboard', { replace: true });
        }
    });

    function onSubmit(data: branchInfo) {
        console.log("Create Branch form submitted with data:", data);
        const finalData = { ...data, openingDate: data.openingDate ? new Date(data.openingDate).toISOString() : undefined };
        console.log("Final data being sent to API:", finalData);
        createBranchMutation.mutate(finalData);
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Create Branch</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-medium">Branch Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            {...register("name", { required: true })} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="Enter branch name" 
                        />
                    </div>
                    <div>
                        <label className="block mb-2 font-medium">Branch Code <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            {...register("branchCode", { required: true })} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="e.g. BR-001" 
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block mb-2 font-medium">Address</label>
                    <input 
                        type="text" 
                        id="address" 
                        {...register("address")} 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Street address" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="city" className="block mb-2 font-medium">City</label>
                        <input 
                            type="text" 
                            id="city" 
                            {...register("city")} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label htmlFor="postalCode" className="block mb-2 font-medium">Postal Code</label>
                        <input 
                            type="text" 
                            id="postalCode" 
                            {...register("postalCode")} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label htmlFor="country" className="block mb-2 font-medium">Country</label>
                        <input 
                            type="text" 
                            id="country" 
                            {...register("country")} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="phone" className="block mb-2 font-medium">Phone</label>
                        <input 
                            type="text" 
                            id="phone" 
                            {...register("phone")} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="+1 234 567 8900" 
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 font-medium">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            {...register("email")} 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="branch@example.com" 
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="openingDate" className="block mb-2 font-medium">Opening Date</label>
                    <input 
                        type="date" 
                        id="openingDate" 
                        {...register("openingDate")} 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block mb-2 font-medium">Notes</label>
                    <textarea 
                        id="notes" 
                        rows={3} 
                        {...register("notes")} 
                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Any additional information..." 
                    />
                </div>
                
                <div className="border border-gray-200 p-6 rounded-xl bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">Branch Privileges</h3>
                    <p className="text-sm text-gray-500 mb-4">Select what menu fields this branch is allowed to edit.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <input type="checkbox" {...register("privileges.canEditName")} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-gray-700 font-medium text-sm">Can Edit Name</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <input type="checkbox" {...register("privileges.canEditPrice")} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-gray-700 font-medium text-sm">Can Edit Price</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <input type="checkbox" {...register("privileges.canEditImage")} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-gray-700 font-medium text-sm">Can Edit Image</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <input type="checkbox" {...register("privileges.canEditDescription")} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-gray-700 font-medium text-sm">Can Edit Description</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <input type="checkbox" {...register("privileges.canEditCalories")} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-gray-700 font-medium text-sm">Can Edit Calories</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <input type="checkbox" {...register("privileges.canEditPreparationTime")} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-gray-700 font-medium text-sm">Can Edit Prep Time</span>
                        </label>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={createBranchMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-blue-400"
                >
                    {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
                </button>
            </form>
        </div>
    );
}