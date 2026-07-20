export type BreastSide = "left" | "right";
export type MilkType = "breast-milk" | "formula";
export type DiaperType = "wet" | "dirty" | "mixed";
export type SleepLocation = "crib" | "parents-bed" | "stroller" | "car" | "other";

type ActivityBase = {
  id: string;
  babyId: string;
  startedAt: string;
  endedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type SleepActivity = ActivityBase & {
  type: "sleep";
  data: {
    location?: SleepLocation;
  };
};

export type BreastfeedingActivity = ActivityBase & {
  type: "breastfeeding";
  data: {
    firstSide: BreastSide;
    leftDurationSeconds: number;
    rightDurationSeconds: number;
  };
};

export type BottleActivity = ActivityBase & {
  type: "bottle";
  data: {
    amountMl: number;
    milkType: MilkType;
  };
};

export type DiaperActivity = ActivityBase & {
  type: "diaper";
  data: {
    diaperType: DiaperType;
  };
};

export type MedicineActivity = ActivityBase & {
  type: "medicine";
  data: {
    medicineName: string;
    dose: string;
  };
};

export type GrowthActivity = ActivityBase & {
  type: "growth";
  data: {
    weightKg?: number;
    heightCm?: number;
    headCircumferenceCm?: number;
  };
};

export type Activity =
  | SleepActivity
  | BreastfeedingActivity
  | BottleActivity
  | DiaperActivity
  | MedicineActivity
  | GrowthActivity;

export type ActivityType = Activity["type"];