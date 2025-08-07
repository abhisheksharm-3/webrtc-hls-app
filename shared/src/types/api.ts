/**
 * Shape of the request body for creating a new room.
 */
export interface CreateRoomRequest {
  name: string;
}

/**
 * Shape of the response after successfully creating a room.
 */
export interface CreateRoomResponse {
  roomId: string;
  hlsUrl: string;
}