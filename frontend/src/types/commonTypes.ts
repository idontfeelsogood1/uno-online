export interface PlayerLobbyProps {
  lobbyState: RoomData[];
  setHomeView: (view: HomeViewState) => void;
}

export interface PlayerVsPlayerProps {
  setHomeView: (view: HomeViewState) => void;
}

export interface RoomProps {
  roomState: RoomData;
}

export interface GameProps {
  gameState: GameData;
  actionSocketId: string;
}

export interface GameBoardProps {
  topCard: Card;
  enforcedColor: CardColor;
}

export interface OtherPlayerProps {
  otherPlayer: GamePlayer;
}

export interface OtherHandProps {
  otherHand: Card[];
}

export interface CurrentPlayerProps {
  player: GamePlayer;
}

export interface PlayHandProps {
  pseudoHand: Card[];
  pseudoPlayHand: Card[];
  setPseudoPlayHand: CallableFunction;
  setPseudoHand: CallableFunction;
}

export interface HandProps {
  pseudoHand: Card[];
  pseudoPlayHand: Card[];
  setPseudoPlayHand: CallableFunction;
  setPseudoHand: CallableFunction;
}

export interface ChooseColorProps {
  actionCallback: CallableFunction;
}

export interface RoomData {
  readonly roomId: string;
  readonly roomName: string;
  readonly maxPlayers: number;
  readonly hasRoomStarted: boolean;

  readonly ownerSocketId: string;
  readonly ownerUsername: string;

  readonly currentPlayers: RoomPlayer[];
}

export interface RoomPlayer {
  readonly socketId: string;
  readonly username: string;
}

export interface GameData {
  readonly currentPlayerIndex: number;
  readonly playerOrder: GamePlayer[];
  readonly direction: number;
  readonly topCard: Card;
  readonly enforcedColor: CardColor;
}

export interface GamePlayer {
  readonly socketId: string;
  readonly username: string;
  readonly hand: Card[];
  readonly uno: boolean;
}

export interface Card {
  readonly id: string;
  readonly name: string;
  readonly color: CardColor;
  readonly value: CardValue;
}

export type CardColor = "BLUE" | "GREEN" | "RED" | "YELLOW" | "BLACK";

export type CardValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "SKIP"
  | "REVERSE"
  | "+2"
  | "WILD"
  | "+4";

export type WrapperViewState = "LOBBY" | "ROOM" | "GAME";
export type HomeViewState = "BOT" | "PVP" | null;
export type LobbyStateActionType = "get-lobby";
export type RoomStateActionType =
  | "create-room"
  | "join-room"
  | "player-joined-room"
  | "leave-room"
  | "player-left-room"
  | "transfered-owner";
export type GameStateActionType =
  | "game-started"
  | "draw-cards"
  | "played-cards"
  | "player-won"
  | "player-left"
  | "game-ended";
