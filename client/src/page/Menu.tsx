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
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <p className="text-sm sm:text-base text-gray-500">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
          {/* Main Categories */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="inline-flex gap-2 sm:gap-3 p-1.5 bg-[#efefef] rounded-xl overflow-x-auto max-w-full">
              {mainCategories.map((mainCategory: { id: string; name: string }) => (
                <button
                  key={mainCategory.id}
                  onClick={() => {
                    setSelectedMainCategoryId(mainCategory.id);
                    setSelectedSubCategoryId(null); // reset sub when main changes
                  }}
                  className={`cursor-pointer px-4 sm:px-5 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors whitespace-nowrap ${
                    mainCategory.id === effectiveMainCategoryId
                      ? "bg-[#2f2f2f] text-white"
                      : "bg-[#d7d7d7] text-[#333333] hover:bg-[#c9c9c9]"
                  }`}
                >
                  {mainCategory.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          <div className="flex justify-center mb-5 sm:mb-7">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 max-w-full">
              {filteredSubcategories.map((subcategory: { id: string; name: string }) => (
                <button
                  key={subcategory.id}
                  onClick={() => setSelectedSubCategoryId(subcategory.id)}
                  className={`cursor-pointer px-3.5 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors border whitespace-nowrap ${
                    effectiveSubCategoryId === subcategory.id
                      ? "bg-[#ffb400] text-black border-[#ffb400]"
                      : "bg-[#3f3f3f] text-white border-[#3f3f3f] hover:bg-[#2f2f2f]"
                  }`}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {isLoadingMenu ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading menu items...
          </div>
        ) : filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item: { id: string; name: string; imageUrl?: string; price: number; description?: string }) => (
            <div
              key={item.id}
              className="border border-[#e4e4e4] rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-40 sm:h-44 lg:h-48 object-contain bg-white p-3"
                />
              ) : (
                <div className="w-full h-40 sm:h-44 lg:h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  No Image Available
                </div>
              )}
              <div className="p-4 flex flex-col grow text-center">
                <div className="mb-1">
                  <span className="text-base sm:text-lg font-semibold text-[#2a2a2a] tracking-wide">
                    {item.price} br
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#222222] leading-tight">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-gray-600 text-xs sm:text-sm mt-2 grow">
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
      </div>
    </div>
  );
}
