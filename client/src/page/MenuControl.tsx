import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export default function MenuControl() {

    const getAllMenuItems = useQuery({
        queryKey: ["menuItems"],
        queryFn: async () => {
            const res = await api.get("/menu/items");
            if (!res.data.success) {
                throw new Error(res.data.message);
            }
            return res.data.data;
        },

    })

    console.log("Menu items data:", getAllMenuItems.data);
    console.log("error:", getAllMenuItems.error);
  return (
      <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Menu Control</h1>
          {
              getAllMenuItems.data?.map((item: { id: string; name: string, image: string, price: number, available: boolean }) => (
                  <div key={item.id} className="p-2 border rounded mb-2">
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <p className="text-xl font-bold">${item.price}</p>
                      {item.image && (
                          <img src={item.image} alt={item.name} className="w-full h-auto mt-2" />
                      )}
                      <p className="text-sm text-gray-500">
                          {item.available ? "Available" : "Not Available"}
                      </p>
                  </div>
              ))
          }
      
    </div>
  );
}