import type { RoomData } from "../commonTypes";

export interface LobbyDto {
  lobbyState: RoomData[];
}

export interface RoomDto {
  roomState: RoomData;
}

export interface PlayerJoinedRoomDto {
  socketId: string;
  username: string;
  roomState: RoomData;
}

export interface PlayerLeftRoomDto {
  socketId: string;
  username: string;
  roomState: RoomData;
}
