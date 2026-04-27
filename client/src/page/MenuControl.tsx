import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { queryClient } from "../lib/queryClient";

export default function MenuControl() {
    const [searchParams, setSearchParams] = useSearchParams();
    const lang = searchParams.get("lang") || "am";
  const navigate = useNavigate();
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

  // Fetch Main Categories
  const { data: mainCategoriesData, isLoading: isLoadingMain } = useQuery({
    queryKey: ["mainCategories", lang],
    queryFn: async () => {
      const response = await api.get(`/menu/categories?lang=${lang}`);
      return response.data;
    },
  });

  // Fetch Subcategories
  const { data: subcategoriesData, isLoading: isLoadingSub } = useQuery({
    queryKey: ["subcategories", lang],
    queryFn: async () => {
      const response = await api.get(`/menu/subcategories?lang=${lang}`);
      return response.data;
    },
  });

  // Fetch Menu Items
  const { data: menuItemsData, isLoading: isLoadingMenu } = useQuery({
    queryKey: ["menuItems", lang],
    queryFn: async () => {
      const res = await api.get(`menu/branch/full-menu?lang=${lang}`);
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      return res.data;
      },
    refetchInterval: 3000,
  });
    
    const toggleAvailable = useMutation({
        mutationFn: async ({itemId, isAvailable }: {itemId: string, isAvailable: boolean}) => {
            const response = await api.patch(`/menu/branches/menu/${itemId}/availability`, { isAvailable });
            return response.data;
        },
        onMutate: async ({ itemId, isAvailable }) => {
            // Cancel outgoing refetches so they don't overwrite optimistic update
            await queryClient.cancelQueries({ queryKey: ["menuItems", lang] });

            // Snapshot the previous value
            const previousMenuItems = queryClient.getQueryData(["menuItems", lang]);

            // Optimistically update the menu item
            queryClient.setQueryData(["menuItems", lang], (old: any) => {
                if (!old || !old.data) return old;
                return {
                    ...old,
                    data: old.data.map((item: any) => 
                        item.id === itemId ? { ...item, isAvailable: isAvailable } : item
                    )
                };
            });

            return { previousMenuItems };
        },
        onError: (err, variables, context) => {
            // Roll back to previous state on error
            if (context?.previousMenuItems) {
                queryClient.setQueryData(["menuItems", lang], context.previousMenuItems);
            }
        },
        onSettled: () => {
            // Refetch after error or success to guarantee fresh data
            queryClient.invalidateQueries({ queryKey: ["menuItems", lang] });
        },
    }); 

    function handleToggleAvailable(itemId: string, isAvailable: boolean) {
        toggleAvailable.mutate({ itemId, isAvailable });
    }

  const mainCategories = mainCategoriesData?.data || [];
  const allSubcategories = subcategoriesData?.data || [];
  const allMenuItems = menuItemsData?.data || [];

  // Auto-select first main category when data loads
  useEffect(() => {
    if (mainCategories.length > 0 && !selectedMainCategoryId) {
      setSelectedMainCategoryId(mainCategories[0].id);
    }
  }, [mainCategories, selectedMainCategoryId]);

  // Filter subcategories by selected main category
  const filteredSubcategories = allSubcategories.filter(
    (sub: any) => sub.mainCategory?.id === selectedMainCategoryId
  );

  // Auto-select first subcategory when filtered subcategories change
  useEffect(() => {
    if (filteredSubcategories.length > 0) {
      const isSelectedStillValid = filteredSubcategories.some(
        (sub: any) => sub.id === selectedSubCategoryId
      );
      if (!isSelectedStillValid) {
        setSelectedSubCategoryId(filteredSubcategories[0].id);
      }
    } else {
      setSelectedSubCategoryId(null);
    }
  }, [filteredSubcategories, selectedSubCategoryId]);

  // Filter menu items by selected subcategory
  const filteredMenuItems = allMenuItems.filter(
    (item: any) => item.subcategory?.id === selectedSubCategoryId
  );

  const handleEdit = (id: string) => {
    // Navigating to a potential edit page, assuming the route might be /admin/menu/edit/:id or similar
    console.log("Edit item:", id);
    // navigate(`/edit-menu-item/${id}`);
  };

  if (isLoadingMain || isLoadingSub || isLoadingMenu) {
    return <div className="flex justify-center items-center h-64 text-xl font-semibold text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Menu Control</h1>
      </div>

      {/* Main Categories Filter */}
      <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Main Category</h2>
              <select name="lang" id="lang" onChange={(e) => setSearchParams({ lang: e.target.value })}>
                <option value="am">amharic</option>
                  <option value="en">English</option>
                  <option value="oro">Afaan Oromo</option>
              </select>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mainCategories.map((mainCategory: { id: string; name: string }) => (
            <button
              key={mainCategory.id}
              onClick={() => setSelectedMainCategoryId(mainCategory.id)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap border-2 ${
                mainCategory.id === selectedMainCategoryId
                  ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
              }`}
            >
              {mainCategory.name}
            </button>
          ))}
          {mainCategories.length === 0 && (
            <p className="text-gray-500 italic py-2">No main categories found.</p>
          )}
        </div>
      </div>

      {/* Subcategories Filter */}
      <div className="mb-10 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Subcategory</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {filteredSubcategories.map((subcategory: { id: string; name: string }) => (
            <button
              key={subcategory.id}
              onClick={() => setSelectedSubCategoryId(subcategory.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shadow-sm border ${
                selectedSubCategoryId === subcategory.id
                  ? "bg-green-500 text-white border-green-600"
                  : "bg-white text-gray-600 hover:bg-gray-100 border-gray-200"
              }`}
            >
              {subcategory.name}
            </button>
          ))}
          {filteredSubcategories.length === 0 && (
            <p className="text-gray-500 italic">No subcategories available for this category.</p>
          )}
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Image</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Edit</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Availability</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item: any) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.isAvailable !== false ? "" : "bg-red-50/30"}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-extrabold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">${item.price}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">{item.description || "No description provided."}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="inline-flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {(() => {
                      const isToggling = toggleAvailable.isPending && toggleAvailable.variables?.itemId === item.id;
                      return (
                        <button
                          onClick={() => handleToggleAvailable(item.id, !item.isAvailable)}
                          disabled={isToggling}
                          className={`inline-flex items-center justify-center min-w-[100px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            isToggling
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed opacity-70"
                              : item.isAvailable !== false
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {isToggling ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Wait...
                            </>
                          ) : (
                            item.isAvailable !== false ? "Available" : "Unavailable"
                          )}
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <p className="text-lg font-medium text-gray-900">No items found</p>
                    <p className="text-sm mt-1">There are no menu items in this subcategory yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}