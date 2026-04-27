import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  subcategory: {
    id: string;
    name: string;
  };
  mainCategory: {
    id: string;
    name: string;
  };
};

const languageOptions = [
  { code: "en", label: "English" },
  { code: "am", label: "Amharic" },
  { code: "oro", label: "Oromifa" },
];

export default function ViewAllMenu() {
    const [selectedMainCategoryId, setSelectedMainCategoryId] = useState("");
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
    const navigate = useNavigate();

    const { data: menuItems = [], isLoading, isError } = useQuery({
    queryKey: ["allMenuItems", selectedLanguage],
        queryFn: async () => {
      const res = await api.get("/menu/items", {
        params: {
          lang: selectedLanguage,
        },
      });
            return res.data.data as MenuItem[];
        },
    });

    const mainCategories = useMemo(() => {
        const uniqueCategories = new Map<string, { id: string; name: string }>();
        menuItems.forEach((item) => {
            uniqueCategories.set(item.mainCategory.id, item.mainCategory);
        });
        return Array.from(uniqueCategories.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [menuItems]);

    const subcategories = useMemo(() => {
        const uniqueSubcategories = new Map<string, { id: string; name: string }>();
        menuItems
            .filter(
                (item) =>
                    !selectedMainCategoryId || item.mainCategory.id === selectedMainCategoryId,
            )
            .forEach((item) => {
                uniqueSubcategories.set(item.subcategory.id, item.subcategory);
            });

        return Array.from(uniqueSubcategories.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [menuItems, selectedMainCategoryId]);

    const filteredItems = useMemo(() => {
        return menuItems.filter((item) => {
            const matchesMainCategory =
                !selectedMainCategoryId || item.mainCategory.id === selectedMainCategoryId;
            const matchesSubcategory =
                !selectedSubcategoryId || item.subcategory.id === selectedSubcategoryId;
            return matchesMainCategory && matchesSubcategory;
        });
    }, [menuItems, selectedMainCategoryId, selectedSubcategoryId]);

    const handleMainCategoryChange = (value: string) => {
        setSelectedMainCategoryId(value);
        setSelectedSubcategoryId("");
    };

    if (isLoading) {
        return <div>Loading menu items...</div>;
    }

    if (isError) {
        return <div>Failed to load menu items.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">View All Menu Items</h1>

      <div className="mb-4 max-w-xs">
        <label className="block mb-2 font-medium">Language</label>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            setSelectedLanguage(e.target.value);
            setSelectedMainCategoryId("");
            setSelectedSubcategoryId("");
          }}
          className="w-full border p-3 rounded-lg"
        >
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block mb-2 font-medium">Main Category</label>
                    <select
                        value={selectedMainCategoryId}
                        onChange={(e) => handleMainCategoryChange(e.target.value)}
                        className="w-full border p-3 rounded-lg"
                    >
                        <option value="">All Main Categories</option>
                        {mainCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-2 font-medium">Subcategory</label>
                    <select
                        value={selectedSubcategoryId}
                        onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                        className="w-full border p-3 rounded-lg"
                    >
                        <option value="">All Subcategories</option>
                        {subcategories.map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left">Image</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-center" colSpan={4}>
                                    No menu items found for selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-12 w-12 object-cover rounded"
                                            />
                                        ) : (
                                            <span className="text-gray-500">No image</span>
                                        )}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {Number(item.price).toFixed(2)}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <button
                                            type="button"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                            onClick={() =>
                                                navigate(`/admin/edit-menu-item/${item.id}`, {
                                                    state: { from: "/admin/dashboard/view-menu" },
                                                })
                                            }
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}