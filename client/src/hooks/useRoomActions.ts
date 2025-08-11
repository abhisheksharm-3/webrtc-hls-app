import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { generateRoomId } from "@/lib/room-utils";
import { createRoomOnServer } from "@/lib/api";

type UserActionRole = 'guest' | 'viewer';

/**
 * @description A custom hook to manage all user actions related to creating, joining, and watching rooms.
 * It encapsulates state, routing, and session management.
 * @returns An object with the room ID state and handler functions.
 */
export const useRoomActions = () => {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  const { joinRoom } = useAppStore();

  const generateDisplayName = (prefix: string) =>
    `${prefix}-${Math.random().toString(36).slice(2, 6)}`;

  /**
   * Creates a new room, registers it with the server, and navigates the host to the stream page.
   */
  const handleCreateRoom = async () => {
    try {
      const newRoomId = generateRoomId();
      // ✅ Bug Fix: Generate name once and reuse it.
      const hostName = generateDisplayName("Host");
      const newRoomName = `New Stream by ${hostName}`;

      await createRoomOnServer(newRoomId, newRoomName);

      joinRoom({
        roomCode: newRoomId,
        userName: hostName,
        role: "host",
      });
      router.push(`/stream/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      // Optionally: show a user-facing error notification here.
    }
  };

  /**
   * Generic handler to navigate a user to a room as either a guest or a viewer.
   */
  const handleNavigateToRoom = (role: UserActionRole) => {
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) return;

    joinRoom({
      roomCode: trimmedRoomId,
      userName: generateDisplayName(role === 'guest' ? "Guest" : "Viewer"),
      role: role,
    });
    
    const path = role === 'guest' ? '/stream' : '/watch';
    router.push(`${path}/${trimmedRoomId}`);
  };

  return {
    roomId,
    setRoomId,
    handleCreateRoom,
    // ✅ Abstracted Logic: These handlers are now simpler.
    handleJoinRoom: () => handleNavigateToRoom('guest'),
    handleWatchRoom: () => handleNavigateToRoom('viewer'),
  };
};