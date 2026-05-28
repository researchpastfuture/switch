// Section 7 — brigade-builder. Compare a chosen roster to recommended ratios per N students.
export interface BrigadeRole {
  id: string;
  label: string;
  recommendedPer: number; // recommended count per `studentsPer` students
  max: number;
}

export interface BrigadeData {
  studentsPer: number;
  defaultStudents: number;
  roles: BrigadeRole[];
}

export const brigade: BrigadeData = {
  studentsPer: 500,
  defaultStudents: 1000,
  roles: [
    { id: 'coordinator', label: 'Safety coordinator', recommendedPer: 1, max: 10 },
    { id: 'monitors', label: 'Trained monitors', recommendedPer: 4, max: 40 },
    { id: 'medics', label: 'First-aid responders', recommendedPer: 2, max: 20 },
    { id: 'liaison', label: 'Family liaison', recommendedPer: 1, max: 10 },
    { id: 'comms', label: 'Communications lead', recommendedPer: 1, max: 10 },
  ],
};
