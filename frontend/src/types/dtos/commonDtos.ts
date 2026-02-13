import type { GameData, GameStateActionType, RoomData } from "../commonTypes";

export interface LobbyDto {
  lobbyState: RoomData[];
}

export interface RoomDto {
  roomState: RoomData;
}

export interface GameDto {
  gameState: GameData;
}

export interface RoomStateUpdateDto {
  socketId: string;
  username: string;
  roomState: RoomData;
}

export interface GameStateUpdateDto {
  ActionType: GameStateActionType;
  socketId?: string;
  username?: string;
  gameState: GameData;
}
