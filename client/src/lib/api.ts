"use server"
/**
 * @description Registers a new room on the backend server.
 * @param {string} roomId - The unique ID for the new room.
 * @param {string} roomName - A descriptive name for the room.
 * @throws Will throw an error if the server response is not ok.
 */
export const createRoomOnServer = async (roomId: string, roomName: string): Promise<void> => {
  const serverUrl = process.env.SERVER_URL || "http://localhost:3001";

  const response = await fetch(`${serverUrl}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: roomId, name: roomName }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create room on server: ${response.status} ${errorBody}`);
  }
};