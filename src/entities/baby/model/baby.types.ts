export type BabyGender = "boy" | "girl" | "unspecified";

export interface Baby {
  id: string;
  name: string;
  birthday: string;
  gender: BabyGender;
  gestationalWeek?: number;
  createdAt: string;
  updatedAt: string;
}