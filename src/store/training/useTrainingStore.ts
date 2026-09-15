import { create } from "zustand";

export interface NextTrainingEvent {
  title: string;
  date: string;
  start_time: string | null;
}

interface TrainingState {
  // maintenance_modes.is_training_disabled from onLoad — 1 hides the
  // "Software Training" button on the intro screen.
  isTrainingDisabled: boolean;
  setTrainingDisabled: (value: boolean) => void;
  // onLoad's next_training_event — same shared master DB event_masters
  // table adminpanel's public calendar reads, next upcoming row only.
  // null when no event is scheduled.
  nextTrainingEvent: NextTrainingEvent | null;
  setNextTrainingEvent: (value: NextTrainingEvent | null) => void;
}

const useTrainingStore = create<TrainingState>((set) => ({
  isTrainingDisabled: false,
  setTrainingDisabled: (value: boolean) => set({ isTrainingDisabled: value }),
  nextTrainingEvent: null,
  setNextTrainingEvent: (value: NextTrainingEvent | null) => set({ nextTrainingEvent: value }),
}));

export default useTrainingStore;
