export interface PlayerLobbyProps {
  readonly lobbyState: RoomData[];
  readonly setHomeView: (view: HomeViewState) => void;
}

export interface PlayerVsPlayerProps {
  readonly setHomeView: (view: HomeViewState) => void;
}

export interface PlayerVsBotProps {
  readonly setHomeView: (view: HomeViewState) => void;
}

export interface CreateGameLobbyProps {
  readonly setHomeView: (view: HomeViewState) => void;
  readonly setMaxPlayers: CallableFunction;
}

export interface RoomProps {
  readonly roomState: RoomData;
}

export interface GameProps {
  readonly gameState: GameData;
  readonly actionSocketId: string;
  readonly actionType: GameStateActionType;
}

export interface GameBoardProps {
  readonly topCard: Card;
  readonly enforcedColor: CardColor;
  readonly gridPosition: string;
  readonly gameState: GameData;
  readonly setPlayers: CallableFunction;
  readonly hasInitialized: boolean;
  readonly setHasInitialized: CallableFunction;
}

export interface OtherPlayerProps {
  readonly otherPlayer: GamePlayer;
  readonly gridPosition: object;
}

export interface OtherHandProps {
  readonly otherHand: Card[];
  readonly position: string;
}

export interface CurrentPlayerProps {
  readonly player: GamePlayer;
  readonly gridPosition: string;
  readonly hasInitialized: boolean;
}

export interface PlayHandProps {
  readonly pseudoHand: Card[];
  readonly pseudoPlayHand: Card[];
  readonly setPseudoPlayHand: CallableFunction;
  readonly setNewStateReceived: CallableFunction;
}

export interface HandProps {
  readonly pseudoHand: Card[];
  readonly pseudoPlayHand: Card[];
  readonly setPseudoPlayHand: CallableFunction;
  readonly newStateReceived: boolean;
  readonly hasInitialized: boolean;
}

export interface ChooseColorProps {
  readonly actionCallback: CallableFunction;
}

export interface GameActionProps {
  readonly actionType: GameStateActionType;
  readonly actionSocketId: string;
}

export interface GameEndProps {
  players: RoomPlayer[];
  ownerSocketId: string;
  setHomeView: CallableFunction;
  continueGame: CallableFunction;
}

export interface BotGameEndProps {
  readonly setHomeView: (view: HomeViewState) => void;
  readonly continueGame: CallableFunction;
}

export interface GridPosition {
  placement: string;
  position: string;
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
  readonly playedCards: Card[] | undefined;
  readonly cardDrew: Card | undefined;
}

export interface GamePlayer {
  readonly socketId: string;
  readonly username: string;
  hand: Card[];
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
  | "create-game"
  | "game-started"
  | "draw-cards"
  | "played-cards"
  | "player-left"
  | "game-ended";
