import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppNotification } from "../entities/notification/notification.types";

interface NotificationStore { notifications: AppNotification[]; addNotification: (notification: AppNotification) => boolean; markRead: (id: string) => void; markAllRead: () => void; dismiss: (id: string) => void; clearRead: () => void; clearAll: () => void }
export const selectUnreadCount = (state: NotificationStore) => state.notifications.filter((item) => item.status === "unread").length;
export const selectUnreadNotifications = (state: NotificationStore) => state.notifications.filter((item) => item.status === "unread");
export const selectReadNotifications = (state: NotificationStore) => state.notifications.filter((item) => item.status === "read");
export const notificationsForBaby = (notifications: AppNotification[], babyId: string | null) => notifications.filter((item) => !item.babyId || item.babyId === babyId);
export const selectUnreadCountForBaby = (babyId: string | null) => (state: NotificationStore) => notificationsForBaby(state.notifications, babyId).filter((item) => item.status === "unread").length;

export const useNotificationStore = create<NotificationStore>()(persist((set, get) => ({
  notifications: [],
  addNotification: (notification) => { if (get().notifications.some((item) => item.triggerKey === notification.triggerKey)) return false; set((state) => ({ notifications: [notification, ...state.notifications].slice(0, 100) })); return true; },
  markRead: (id) => set((state) => ({ notifications: state.notifications.map((item) => item.id === id && item.status === "unread" ? { ...item, status: "read", readAt: new Date().toISOString() } : item) })),
  markAllRead: () => { const readAt = new Date().toISOString(); set((state) => ({ notifications: state.notifications.map((item) => item.status === "unread" ? { ...item, status: "read", readAt } : item) })); },
  dismiss: (id) => set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, status: "dismissed" } : item) })),
  clearRead: () => set((state) => ({ notifications: state.notifications.filter((item) => item.status !== "read" && item.status !== "dismissed") })),
  clearAll: () => set({ notifications: [] }),
}), { name: "babynest-notifications", version: 1, migrate: (persisted) => ({ notifications: ((persisted as Partial<NotificationStore> | undefined)?.notifications ?? []).filter((item) => item.id && item.triggerKey && !Number.isNaN(new Date(item.createdAt).getTime())).slice(0, 100) }) }));
