import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type UserRole = 'host' | 'guest' | 'viewer';

/**
 * Defines the shape of the global application state.
 */
export interface AppState {
  // Session state
  roomCode: string | null;
  userName: string | null;
  userRole: UserRole | null;
  isInRoom: boolean;
  
  // Actions to modify the state
  joinRoom: (details: { roomCode: string, userName: string, role: UserRole }) => void;
  leaveRoom: () => void;
  setUserName: (name: string) => void;
}

/**
 * The initial state when the application loads.
 */
const initialState = {
  roomCode: null,
  userName: null,
  userRole: null,
  isInRoom: false,
};

/**
 * The main Zustand store for global application state.
 * It uses `devtools` for Redux DevTools integration and `persist`
 * to save state to localStorage, allowing it to survive page reloads.
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        /**
         * Sets the user's state for joining a room.
         * This is the primary action for entering a stream or watch page.
         */
        joinRoom: (details) => set({
          roomCode: details.roomCode,
          userName: details.userName,
          userRole: details.role,
          isInRoom: true,
        }),
        
        /**
         * Resets the session state when a user leaves a room.
         */
        leaveRoom: () => set({
          ...initialState
        }),

        /**
         * Updates the user's name.
         */
        setUserName: (name: string) => set({
          userName: name
        }),
      }),
      {
        // Configuration for the persistence middleware
        name: 'app-session-storage', // The key to use in localStorage
      }
    )
  )
);
