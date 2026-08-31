import { create } from "zustand";

interface TrainingState {
  // maintenance_modes.is_training_disabled from onLoad — 1 hides the
  // "Software Training" button on the intro screen.
  isTrainingDisabled: boolean;
  setTrainingDisabled: (value: boolean) => void;
}

const useTrainingStore = create<TrainingState>((set) => ({
  isTrainingDisabled: false,
  setTrainingDisabled: (value: boolean) => set({ isTrainingDisabled: value }),
}));

export default useTrainingStore;
