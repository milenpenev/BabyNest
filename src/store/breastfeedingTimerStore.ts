import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { BreastSide } from "../entities/activity/model/activity.types";

interface BreastfeedingSession {
  id: string;
  babyId: string;
  startedAt: string;
  firstSide: BreastSide;
  activeSide: BreastSide | null;
  lastActiveSide: BreastSide;
  sideStartedAt: string | null;
  leftDurationMilliseconds: number;
  rightDurationMilliseconds: number;
  isPaused: boolean;
}

interface FinishedBreastfeedingSession {
  id: string;
  babyId: string;
  startedAt: string;
  endedAt: string;
  firstSide: BreastSide;
  leftDurationSeconds: number;
  rightDurationSeconds: number;
}

interface BreastfeedingTimerStore {
  activeSession: BreastfeedingSession | null;

  startSession: (
    babyId: string,
    firstSide: BreastSide,
  ) => boolean;

  switchSide: (side: BreastSide) => void;
  pauseSession: () => void;
  resumeSession: () => void;

  finishSession: () =>
    | FinishedBreastfeedingSession
    | null;

  cancelSession: () => void;
}

function addCurrentSideDuration(
  session: BreastfeedingSession,
  referenceDate = new Date(),
): BreastfeedingSession {
  if (
    session.isPaused ||
    !session.activeSide ||
    !session.sideStartedAt
  ) {
    return session;
  }

  const elapsedMilliseconds = Math.max(
    0,
    referenceDate.getTime() -
      new Date(session.sideStartedAt).getTime(),
  );

  if (session.activeSide === "left") {
    return {
      ...session,
      leftDurationMilliseconds:
        session.leftDurationMilliseconds +
        elapsedMilliseconds,
      sideStartedAt: referenceDate.toISOString(),
    };
  }

  return {
    ...session,
    rightDurationMilliseconds:
      session.rightDurationMilliseconds +
      elapsedMilliseconds,
    sideStartedAt: referenceDate.toISOString(),
  };
}

export const useBreastfeedingTimerStore =
  create<BreastfeedingTimerStore>()(
    persist(
      (set, get) => ({
        activeSession: null,

        startSession: (babyId, firstSide) => {
          if (get().activeSession) {
            return false;
          }

          const startedAt = new Date().toISOString();

          set({
            activeSession: {
              id: crypto.randomUUID(),
              babyId,
              startedAt,
              firstSide,
              activeSide: firstSide,
              lastActiveSide: firstSide,
              sideStartedAt: startedAt,
              leftDurationMilliseconds: 0,
              rightDurationMilliseconds: 0,
              isPaused: false,
            },
          });

          return true;
        },

        switchSide: (side) => {
          const session = get().activeSession;

          if (
            !session ||
            session.isPaused ||
            session.activeSide === side
          ) {
            return;
          }

          const now = new Date();
          const updatedSession =
            addCurrentSideDuration(session, now);

          set({
            activeSession: {
              ...updatedSession,
              activeSide: side,
              lastActiveSide: side,
              sideStartedAt: now.toISOString(),
            },
          });
        },

        pauseSession: () => {
          const session = get().activeSession;

          if (!session || session.isPaused) {
            return;
          }

          const updatedSession =
            addCurrentSideDuration(session);

          set({
            activeSession: {
              ...updatedSession,
              activeSide: null,
              sideStartedAt: null,
              isPaused: true,
            },
          });
        },

        resumeSession: () => {
          const session = get().activeSession;

          if (!session || !session.isPaused) {
            return;
          }

          set({
            activeSession: {
              ...session,
              activeSide: session.lastActiveSide,
              sideStartedAt: new Date().toISOString(),
              isPaused: false,
            },
          });
        },

        finishSession: () => {
          const session = get().activeSession;

          if (!session) {
            return null;
          }

          const endedAt = new Date();
          const completedSession =
            addCurrentSideDuration(session, endedAt);

          const finished: FinishedBreastfeedingSession = {
            id: completedSession.id,
            babyId: completedSession.babyId,
            startedAt: completedSession.startedAt,
            endedAt: endedAt.toISOString(),
            firstSide: completedSession.firstSide,
            leftDurationSeconds: Math.floor(
              completedSession.leftDurationMilliseconds /
                1000,
            ),
            rightDurationSeconds: Math.floor(
              completedSession.rightDurationMilliseconds /
                1000,
            ),
          };

          set({
            activeSession: null,
          });

          return finished;
        },

        cancelSession: () =>
          set({
            activeSession: null,
          }),
      }),
      {
        name: "babynest-breastfeeding-timer",
      },
    ),
  );