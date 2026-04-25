import { Card, CardColor } from '../model/card/Card';

export class PublicRoomState {
  constructor(
    roomId: string,
    roomName: string,
    maxPlayers: number,
    hasRoomStarted: boolean,
    ownerSocketId: string,
    ownerUsername: string,
    currentPlayers: PublicRoomPlayer[],
  ) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.maxPlayers = maxPlayers;
    this.hasRoomStarted = hasRoomStarted;
    this.ownerSocketId = ownerSocketId;
    this.ownerUsername = ownerUsername;
    this.currentPlayers = currentPlayers;
  }

  readonly roomId: string;
  readonly roomName: string;
  readonly maxPlayers: number;
  readonly hasRoomStarted: boolean;

  readonly ownerSocketId: string;
  readonly ownerUsername: string;

  readonly currentPlayers: PublicRoomPlayer[];
}

export class PublicRoomPlayer {
  constructor(socketId: string, username: string) {
    this.socketId = socketId;
    this.username = username;
  }

  readonly socketId: string;
  readonly username: string;
}

export class PublicGameState {
  readonly currentPlayerIndex: number;
  readonly playerOrder: PublicGamePlayer[];
  readonly direction: number;
  readonly topCard: Card;
  readonly enforcedColor: CardColor;

  constructor(
    currentPlayerIndex: number,
    playerOrder: PublicGamePlayer[],
    direction: number,
    topCard: Card,
    enforcedColor: CardColor,
  ) {
    this.currentPlayerIndex = currentPlayerIndex;
    this.playerOrder = playerOrder;
    this.direction = direction;
    this.topCard = topCard;
    this.enforcedColor = enforcedColor;
  }
}

export class PublicGamePlayer {
  readonly socketId: string;
  readonly username: string;
  readonly hand: Card[];
  readonly uno: boolean;

  constructor(socketId: string, username: string, hand: Card[], uno: boolean) {
    this.socketId = socketId;
    this.username = username;
    this.hand = hand;
    this.uno = uno;
  }
}
