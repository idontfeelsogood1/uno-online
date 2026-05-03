import { Player } from '../model/player/Player';
import { GameRoom } from '../model/game-room/GameRoom';

export class CannotDrawCard extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'CannotDrawCard';
  }
}

export class CardsSentMustNotBeEmpty extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'CardsSentMustNotBeEmpty';
  }
}

export class RoomHasNotStarted extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomHasNotStarted';
  }
}

export class RemovedOrTransfered {
  readonly transferedOwner: Player | null;
  readonly removedRoom: GameRoom | null;
  constructor(transferedOwner: Player | null, removedRoom: GameRoom | null) {
    this.transferedOwner = transferedOwner;
    this.removedRoom = removedRoom;
  }
}

export class PlayerIsInARoom extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerIsInARoom';
  }
}

export class PlayerNotInAnyRoom extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerNotInAnyRoom';
  }
}

export class RoomHasStarted extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomHasStarted';
  }
}

export class RoomIsFull extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomIsFull';
  }
}

export class PlayerWon extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerWon';
  }
}

export class HaveNotChoosenColor extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'HaveNotChooseColor';
  }
}

export class CannotUno extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'CannotUno';
  }
}

export class NotPlayerTurn extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'NotPlayerTurn';
  }
}

export class PlayersCountMustBeGreaterThanOne extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayersCountMustBeGreaterThanOne';
  }
}

export class NotRoomOwner extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'NotRoomOwner';
  }
}

export class RoomNotFound extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomNotFound';
  }
}
