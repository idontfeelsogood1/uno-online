import type {
  GameData,
  RoomData,
  LobbyStateActionType,
  RoomStateActionType,
  GameStateActionType,
} from "../commonTypes";

export interface RoomDto {
  roomState: RoomData;
}

export interface LobbyStateUpdateDto {
  actionType: LobbyStateActionType;
  socketId?: string;
  username?: string;
  lobbyState: RoomData[];
}

export interface RoomStateUpdateDto {
  actionType: RoomStateActionType;
  socketId?: string;
  username?: string;
  roomState: RoomData;
}

export interface GameStateUpdateDto {
  actionType: GameStateActionType;
  socketId?: string;
  username?: string;
  gameState: GameData;
}
