import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type UserRole = 'host' | 'guest' | 'viewer';

export interface AppState {
  // Room state
  roomCode: string | null;
  userRole: UserRole | null;
  isInRoom: boolean;
  
  // User state
  isHost: boolean;
  isGuest: boolean;
  isViewer: boolean;
  
  // Actions
  setRoomCode: (code: string) => void;
  setUserRole: (role: UserRole) => void;
  joinAsHost: (roomCode: string) => void;
  joinAsGuest: (roomCode: string) => void;
  joinAsViewer: (roomCode: string) => void;
  leaveRoom: () => void;
  reset: () => void;
}

const initialState = {
  roomCode: null,
  userRole: null,
  isInRoom: false,
  isHost: false,
  isGuest: false,
  isViewer: false,
};

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setRoomCode: (code: string) => set({ roomCode: code }),
      
      setUserRole: (role: UserRole) => set({ 
        userRole: role,
        isHost: role === 'host',
        isGuest: role === 'guest',
        isViewer: role === 'viewer'
      }),
      
      joinAsHost: (roomCode: string) => set({
        roomCode,
        userRole: 'host',
        isInRoom: true,
        isHost: true,
        isGuest: false,
        isViewer: false,
      }),
      
      joinAsGuest: (roomCode: string) => set({
        roomCode,
        userRole: 'guest',
        isInRoom: true,
        isHost: false,
        isGuest: true,
        isViewer: false,
      }),
      
      joinAsViewer: (roomCode: string) => set({
        roomCode,
        userRole: 'viewer',
        isInRoom: true,
        isHost: false,
        isGuest: false,
        isViewer: true,
      }),
      
      leaveRoom: () => set({
        roomCode: null,
        userRole: null,
        isInRoom: false,
        isHost: false,
        isGuest: false,
        isViewer: false,
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'app-store',
    }
  )
);
