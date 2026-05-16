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
  readonly actionContext: GameActionProps;
}

export interface GameBoardProps {
  readonly topCard: Card;
  readonly enforcedColor: CardColor;
  readonly gridPosition: GridPosition;
  readonly gameState: GameData;
  readonly setPlayers: CallableFunction;
  readonly hasInitialized: boolean;
  readonly setHasInitialized: CallableFunction;
  readonly setHasFinishedInitialAnimation: CallableFunction;
}

export interface OtherPlayerProps {
  readonly otherPlayer: GamePlayer;
  readonly gridPosition: object;
}

export interface OtherHandProps {
  readonly otherHand: Card[];
  readonly position: string;
  readonly gridPositionIndex: number;
}

export interface CurrentPlayerProps {
  readonly player: GamePlayer;
  readonly gridPosition: GridPosition;
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
  readonly gridPositionIndex: number;
}

export interface ChooseColorProps {
  readonly actionCallback: CallableFunction;
}

export interface RenderTurnProps {
  readonly currPlayerSocketId: string;
  readonly turnIndicators: {
    readonly socketId: string;
    readonly renderDelay: number;
  }[];
}

export interface GameEndProps {
  readonly players: RoomPlayer[];
  readonly ownerSocketId: string;
  readonly setHomeView: CallableFunction;
  readonly continueGame: CallableFunction;
}

export interface BotGameEndProps {
  readonly setHomeView: (view: HomeViewState) => void;
  readonly continueGame: CallableFunction;
}

export interface GridPosition {
  readonly index: number;
  readonly placement: string;
  readonly position: string;
}

export interface GameInitializeProps {
  readonly hasInitialized: boolean;
  readonly playersSize: number;
  readonly hasFinishedInitialAnimation: boolean;
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

export interface GameActionProps {
  readonly actionType: GameStateActionType;
  readonly actionSocketId: string;
  readonly isActionLocked: boolean;
  readonly playedCards: Card[] | undefined; // THESE ARE ACTIONS OF PREVIOUS PLAYERS, ADDED THROUGH THE DTO
  readonly cardDrew: Card | undefined;
  readonly unoPenalty: boolean | undefined;
}

export interface GameData {
  readonly currentPlayerIndex: number;
  readonly playerOrder: GamePlayer[];
  readonly direction: number;
  readonly topCard: Card;
  readonly enforcedColor: CardColor;
  readonly turnEvents: TurnEvents;
}

export interface TurnEvents {
  readonly skip_amount: number;
  readonly reverse_amount: number;
  readonly draw_two_amount: number;
  readonly wild_amount: number;
  readonly wild_draw_four_amount: number;
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
