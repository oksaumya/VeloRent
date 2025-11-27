import axios from "axios";
import { useLoader } from ".";

export default function useApiPrivate() {
    if (!process.env.REACT_APP_SERVER_BASE_URL) throw new Error("Expected an error object to be thrown.");

    const { showLoader, hideLoader } = useLoader();
    const apiManager = axios.create({
        baseURL: `${process.env.REACT_APP_SERVER_BASE_URL}api`,
        withCredentials: true,
    });

    apiManager.interceptors.request.use(
        (config) => {
            showLoader();
            return config;
        },
        (err) => Promise.reject(err)
    );

    apiManager.interceptors.response.use(
        (response) => {
            // TODO
            hideLoader();
            return response;
        },
        (error) => {
            hideLoader();
            return Promise.reject(error);
        }
    );

    const getCars = async (params) => {
        try {
            console.log("getCars called with params:", params);
            const queryParams = new URLSearchParams(params).toString();
            console.log("Query string:", queryParams);
            const url = `/cars?${queryParams}`;
            console.log("Full URL:", url);
            const res = await apiManager.get(url);
            console.log("Response from server:", res.data);
            return res.data;
        } catch (err) {
            console.error("Error in getCars:", err);
            return { data: [], pagination: null };
        }
    };

    const getUserInfo = async () => {
        try {
            const res = await apiManager.get(`/user/`);
            return res.data;
        } catch (err) {
            return [];
        }
    };

    const newBooking = async (bookingData) => {
        try {
            const res = await apiManager.post(`/cars/newBooking/`, bookingData);
            return res.data;
        } catch (err) {
            return null;
        }
    };

    const confirmBooking = async (success) => {
        try {
            const res = await apiManager.post(`/cars/confirmBooking/`, { success });
            return res.data;
        } catch (err) {
            return null;
        }
    };

    const retryBooking = async (id) => {
        try {
            const res = await apiManager.put(`/cars/${id}`);
            return res.data;
        } catch (err) {
            return null;
        }
    };

    const cancelBooking = async (id) => {
        try {
            const res = await apiManager.delete(`/cars/${id}`);
            return res.data;
        } catch (err) {
            return null;
        }
    };

    const deleteBooking = async (id) => {
        try {
            console.log("Deleting booking with ID:", id);
            const res = await apiManager.delete(`/cars/delete/${id}`);
            console.log("Delete response:", res.data);
            return res.data;
        } catch (err) {
            console.error("Error deleting booking:", err);
            return { message: "Failed to delete booking", next: "" };
        }
    };

    const updateUser = async (data) => {
        try {
            console.table(data);
            const res = await apiManager.post(`/user/update`, { updateData: data });
            return res.data;
        } catch (err) {
            return null;
        }
    };

    return { getCars, getUserInfo, newBooking, retryBooking, confirmBooking, cancelBooking, deleteBooking, updateUser };
}
