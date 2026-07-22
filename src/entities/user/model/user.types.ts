export type SubscriptionType =
  | "free"
  | "premium"
  | "premium-plus";

export interface User {
  id: string;

  name: string;

  email: string;

  subscription: SubscriptionType;
}