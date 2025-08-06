export interface CreateRoomRequest {
  name: string;
}

export interface CreateRoomResponse {
  id: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  createdAt: string;
}

export interface GetRoomsResponse {
  rooms: {
    id: string;
    name: string;
    isActive: boolean;
    participantCount: number;
    createdAt: string;
  }[];
}

export interface GetRoomResponse {
  id: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  hlsUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
