import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

export default  function  Profile() {
    const { id } = useParams();
    const getUserProfile = useQuery({
        queryKey: ["userProfile", id],
        queryFn: async () => {
            // Simulate an API call to fetch user profile
            const response = await api.get(`/users/${id}`);
            return response.data.data; // Assuming the user data is in response.data.data
        }
    });
    if (getUserProfile.isLoading) {
        return <div>Loading...</div>;
    }
    console.log("User Profile Data:", getUserProfile.data);
    return (
        <div>
            <h1>Profile Page</h1>
            {/* Add your profile details and functionality here */}
            <Link to={`/profile/${id}/change-password`}>Change Password</Link>
        </div>
    )
}