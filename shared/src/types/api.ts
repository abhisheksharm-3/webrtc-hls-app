/**
 * Shape of the request body for creating a new room.
 */
export interface CreateRoomRequest {
  id: string;
  name: string;
}

/**
 * Shape of the response after successfully creating a room.
 */
export interface CreateRoomResponse {
  id: string;
  hlsUrl?: string;
}