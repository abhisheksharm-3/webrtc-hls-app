import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type UserRole = 'host' | 'guest' | 'viewer';

/**
 * @description The details required to join a room.
 */
export type SessionDetails = {
  roomCode: string;
  userName: string;
  role: UserRole;
};

/**
 * @description Defines the shape of the global application state and its actions.
 */
export interface AppState {
  // Session state
  roomCode: string | null;
  userName:string | null;
  userRole: UserRole | null;
  isInRoom: boolean;

  // Actions
  joinRoom: (details: SessionDetails) => void;
  leaveRoom: () => void;
  setUserName: (name: string) => void;
}

/**
 * The main Zustand store for global application state.
 * It uses `devtools` for Redux DevTools integration and `persist`
 * to save state to localStorage, allowing it to survive page reloads.
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => {
        // ✅ Define the initial state inside the creator function.
        const initialState = {
          roomCode: null,
          userName: null,
          userRole: null,
          isInRoom: false,
        };

        return {
          ...initialState,

          /**
           * Sets the user's state for joining a room.
           */
          joinRoom: (details) => set({
            roomCode: details.roomCode,
            userName: details.userName,
            userRole: details.role,
            isInRoom: true,
          }),

          /**
           * Resets the session state to its initial values when a user leaves a room.
           */
          leaveRoom: () => set(initialState),

          /**
           * Updates the user's name.
           */
          setUserName: (name: string) => set({
            userName: name
          }),
        };
      },
      {
        name: 'app-session-storage', // The key to use in localStorage
      }
    )
  )
);
