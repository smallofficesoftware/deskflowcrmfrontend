// useTaskCategoryStore.ts
        

import { toast } from 'react-toastify';
import { create } from 'zustand';
import { axiosInstance } from '../../services/axiosInstance';


 interface ITaskCategoryView {
  task_category_name: string;
  id: number;
  task_color: string | undefined | null;
  created_date_time?: string;
  visibility?: number;
  is_assigned_widget: number | string;
}

interface TaskCategoryState {
    taskCategories: ITaskCategoryView[];
    loading: boolean;
    fetchTaskCategoriesSideView: () => Promise<void>;
}
export const useTaskCategoryStoreSideView = create<TaskCategoryState>((set) => ({
    taskCategories: [],
    loading: false,
    fetchTaskCategoriesSideView: async () => {
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


