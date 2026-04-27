import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import api from "../api/axios";

export default function Menu() {
  const { branchId } = useParams();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang") || "en";

  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<
    string | null
  >(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(null);

  const { data: mainCategoriesData, isLoading: isLoadingMain } = useQuery({
    queryKey: ["mainCategories", lang],
    queryFn: async () => {
      const response = await api.get(`/menu/categories?lang=${lang}`);
      return response.data;
    },
  });

  const { data: subcategoriesData, isLoading: isLoadingSub } = useQuery({
    queryKey: ["subcategories", lang],
    queryFn: async () => {
      const response = await api.get(`/menu/subcategories?lang=${lang}`);
      return response.data;
    },
  });

  const { data: menuData, isLoading: isLoadingMenu } = useQuery({
    queryKey: ["menu", lang, branchId],
    queryFn: async () => {
      const response = await api.get(
        `/menu/branches/${branchId}/available-menu?lang=${lang}`,
      );
      return response.data;
    },
    refetchInterval: 3000,
  });

  const mainCategories = useMemo(
    () => mainCategoriesData?.data || [],
    [mainCategoriesData?.data],
  );
  const allSubcategories = useMemo(
    () => subcategoriesData?.data || [],
    [subcategoriesData?.data],
  );

  // Derive the effective main category — fall back to first if selection is stale/null
  const effectiveMainCategoryId = useMemo(() => {
    if (mainCategories.some((c: { id: string }) => c.id === selectedMainCategoryId)) {
      return selectedMainCategoryId;
    }
    return mainCategories[0]?.id ?? null;
  }, [mainCategories, selectedMainCategoryId]);

  // Derive subcategories for the effective main category
  const filteredSubcategories = useMemo(
    () =>
      allSubcategories.filter(
        (sub: { mainCategory?: { id: string } }) => sub.mainCategory?.id === effectiveMainCategoryId,
      ),
    [allSubcategories, effectiveMainCategoryId],
  );

  // Derive the effective sub category — fall back to first if selection is stale/null
  const effectiveSubCategoryId = useMemo(() => {
    if (filteredSubcategories.some((s: { id: string }) => s.id === selectedSubCategoryId)) {
      return selectedSubCategoryId;
    }
    return filteredSubcategories[0]?.id ?? null;
  }, [filteredSubcategories, selectedSubCategoryId]);

  // Derive filtered menu items
  const filteredMenuItems = useMemo(
    () =>
      (menuData?.data || []).filter(
        (item: { mainCategory?: { id: string }; subcategory?: { id: string } }) =>
          item.mainCategory?.id === effectiveMainCategoryId &&
          item.subcategory?.id === effectiveSubCategoryId,
      ),
    [menuData, effectiveMainCategoryId, effectiveSubCategoryId],
  );

  if (isLoadingMain || isLoadingSub) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Menu</h1>

      {/* Main Categories */}
      <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
        {mainCategories.map((mainCategory: { id: string; name: string }) => (
          <button
            key={mainCategory.id}
            onClick={() => {
              setSelectedMainCategoryId(mainCategory.id);
              setSelectedSubCategoryId(null); // reset sub when main changes
            }}
            className={`cursor-pointer px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
              mainCategory.id === effectiveMainCategoryId
                ? "bg-amber-600 text-white font-bold shadow-md"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {mainCategory.name}
          </button>
        ))}
      </div>

      {/* Subcategories */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {filteredSubcategories.map((subcategory: { id: string; name: string }) => (
          <button
            key={subcategory.id}
            onClick={() => setSelectedSubCategoryId(subcategory.id)}
            className={`cursor-pointer px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
              effectiveSubCategoryId === subcategory.id
                ? "bg-green-500 text-white font-bold shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            {subcategory.name}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoadingMenu ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading menu items...
          </div>
        ) : filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item: { id: string; name: string; imageUrl?: string; price: number; description?: string }) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
              <div className="p-4 flex flex-col grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {item.name}
                  </h3>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md ml-2 whitespace-nowrap">
                    ${item.price}
                  </span>
                </div>
                {item.description && (
                  <p className="text-gray-600 text-sm mt-1 grow">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-lg">No items available for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
