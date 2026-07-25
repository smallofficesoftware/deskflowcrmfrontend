// useTaskCategoryStore.ts
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { axiosInstance } from '../../services/axiosInstance';
import { ITaskCategoryView } from '../left-side/LeftSideController';

interface TaskCategoryState {
    taskCategories: ITaskCategoryView[];
    loading: boolean;
    fetchTaskCategories: () => Promise<void>;
}

export const useTaskCategoryStore = create<TaskCategoryState>((set) => ({
    taskCategories: [],
    loading: false,
    fetchTaskCategories: async () => {
        const getUUID = localStorage.getItem("UUID");
        set({ loading: true });

        try {
            const { data } = await axiosInstance.post("getTaskCategory", {
                a_application_login_id: getUUID,
            });

            if (data.ack === 1) {
                set({ taskCategories: data.data?.item || [] });
            }
        } catch (err) {
            toast.error("Failed to load task categories");
        } finally {
            set({ loading: false });
        }
    },
}));


