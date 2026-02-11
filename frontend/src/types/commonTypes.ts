export interface PlayerLobbyProps {
  setHomeView: (view: HomeViewState) => void;
}

export interface PlayerVsPlayerProps {
  setHomeView: (view: HomeViewState) => void;
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
  readonly enforcedColor: typeof CardColor;
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
  readonly color: typeof CardColor;
  readonly value: typeof CardValue;
}

export const CardValue = {
  ZERO: "0",
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
  SKIP: "SKIP",
  REVERSE: "REVERSE",
  DRAW_TWO: "+2",
  WILD: "WILD",
  WILD_DRAW_FOUR: "+4",
} as const;

export const CardColor = {
  RED: "RED",
  BLUE: "BLUE",
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  BLACK: "BLACK", // For Wild cards
} as const;

export type WrapperViewState = "LOBBY" | "ROOM" | "GAME";
export type HomeViewState = "BOT" | "PVP" | null;

export interface RoomProps {
  roomState: RoomData;
}
