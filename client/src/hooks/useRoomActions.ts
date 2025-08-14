"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { generateRoomId } from "@/lib/room-utils";
import { createRoomOnServer } from "@/lib/api";

/**
 * Defines the possible roles a user can have when joining a room.
 */
export type UserActionRole = 'host' | 'guest' | 'viewer';

/**
 * Maps user roles to their corresponding URL paths.
 */
const roleToPath: Record<UserActionRole, string> = {
  host: '/stream',
  guest: '/stream',
  viewer: '/watch',
};

/**
 * A custom hook to manage all user actions related to creating, joining, and
 * watching rooms. It encapsulates state, routing, and session management.
 * @returns An object with the room ID state and handler functions.
 */
export const useRoomActions = () => {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  const { joinRoom } = useAppStore();

  /**
   * Generates a random, descriptive display name for a user.
   * @param {string} prefix - The prefix for the name (e.g., "Host", "Guest").
   * @returns {string} A generated display name.
   */
  const generateDisplayName = (prefix: string): string =>
    `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

  /**
   * Creates a new room, registers it with the server, and navigates the host
   * to the stream page.
   */
  const handleCreateRoom = async () => {
    try {
      const newRoomId = generateRoomId();
      const hostName = generateDisplayName("Host");
      const newRoomName = `Stream by ${hostName}`;

      // This should be an API call to your backend
      await createRoomOnServer(newRoomId, newRoomName);

      joinRoom({
        roomCode: newRoomId,
        userName: hostName,
        role: "host",
      });
      router.push(`${roleToPath.host}/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      // In a real app, you would show a user-facing error notification here.
      // For example: toast.error("Could not create room. Please try again.");
    }
  };

  /**
   * Generic handler to navigate a user to a room as either a guest or a viewer.
   * @param {'guest' | 'viewer'} role - The role the user will assume.
   */
  const handleNavigateToRoom = (role: 'guest' | 'viewer') => {
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) return;

    joinRoom({
      roomCode: trimmedRoomId,
      userName: generateDisplayName(role === 'guest' ? "Guest" : "Viewer"),
      role: role,
    });
    
    const path = roleToPath[role];
    router.push(`${path}/${trimmedRoomId}`);
  };

  return {
    roomId,
    setRoomId,
    handleCreateRoom,
    handleJoinRoom: () => handleNavigateToRoom('guest'),
    handleWatchRoom: () => handleNavigateToRoom('viewer'),
  };
};
