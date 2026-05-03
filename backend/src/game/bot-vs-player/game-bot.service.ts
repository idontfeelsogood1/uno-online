import { Injectable } from '@nestjs/common';
import { Player } from '../model/player/Player';
import { GameRoom } from '../model/game-room/GameRoom';
import { GameBoard } from '../model/game-board/GameBoard';
import { randomUUID } from 'crypto';
import { Card, CardColor } from '../model/card/Card';
import { RoomNotFound } from '../service-exception/service-exception';

@Injectable()
export class GameBotService {
  private rooms: Map<string, GameRoom>;

  constructor() {
    this.rooms = new Map();
  }

  public createRoom(
    id: string,
    name: string,
    ownerId: string,
    maxPlayer: number,
  ): GameRoom {
    return new GameRoom(id, name, ownerId, maxPlayer, new GameBoard(id));
  }

  public setPlayerOfRoom(room: GameRoom, player: Player): void {
    this.rooms.set(room.id, room);
    this.rooms.set(player.socketId, room);
    this.rooms.get(player.socketId)!.addCurrentPlayer(player);
  }

  public addBotToRoom(room: GameRoom, maxPlayers: number) {
    for (let i = 0; i < maxPlayers - 1; i++) {
      room.addCurrentPlayer(new Player(randomUUID(), `Bot ${i + 1}`));
    }
  }

  public startGame(room: GameRoom) {
    const currentPlayers: Player[] = room.getCurrentPlayers();
    room.setHasStarted(true);
    room.setPlayerOrder(currentPlayers);

    const game: GameBoard = room.getGameBoard();
    const cards: Card[] = game.generateUnoDeck();

    game.pushToDrawPile(cards);
    game.shuffleDrawPile();

    const playerOrder: Player[] = room.getPlayerOrder();
    playerOrder.forEach((player) => {
      player.pushToHand(game.popFromDrawPile(7));
    });

    game.startDiscardPile();
    game.setCurrentTopCard(game.getDiscardPile()[0]);
  }

  public destroyRoom(socketId: string): boolean {
    return this.rooms.delete(socketId);
  }

  public getRoomOfPlayer(socketId: string): GameRoom | void {
    const room: GameRoom | undefined = this.rooms.get(socketId);

    if (room) return room;
    else {
      const obj: object = Object.fromEntries(this.rooms);
      throw new RoomNotFound(
        `
        socketId: ${socketId}
        rooms: ${JSON.stringify(obj)}
      `,
        {},
      );
    }
  }

  public isBotTurn(room: GameRoom, playerSocketId: string): boolean {
    return room.getPlayerFromOrder().socketId !== playerSocketId;
  }

  public getCardIds(cards: Card[]): string[] {
    const cardIds: string[] = [];
    for (const card of cards) {
      cardIds.push(card.id);
    }
    return cardIds;
  }

  public generateRandomWildColor(): CardColor {
    const validColors = [
      CardColor.RED,
      CardColor.BLUE,
      CardColor.GREEN,
      CardColor.YELLOW,
    ];
    const randomIndex = Math.floor(Math.random() * validColors.length);
    return validColors[randomIndex];
  }

  // FIGURE OUT DFS
  public getLongestPattern(room: GameRoom, bot: Player): Card[] {
    const patterns: Card[][] = [];
    const game: GameBoard = room.getGameBoard();
    const visited: Set<Card> = new Set<Card>();

    for (const card of bot.getHand()) {
      if (game.isValidFirstMove(card)) {
        visited.add(card);
        this.findAllPattern(patterns, [card], visited, bot.getHand(), game);
        visited.delete(card);
      }
    }

    let maxLength: number = 0;
    let maxIndex: number = 0;
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i].length > maxLength) {
        maxLength = patterns[i].length;
        maxIndex = i;
      }
    }

    return patterns[maxIndex];
  }

  private findAllPattern(
    patterns: Card[][],
    currentPattern: Card[],
    visited: Set<Card>,
    hand: Card[],
    game: GameBoard,
  ): void {
    for (const card of hand) {
      if (
        game.isMatchingPattern(
          currentPattern[currentPattern.length - 1],
          card,
        ) &&
        !visited.has(card)
      ) {
        visited.add(card);
        this.findAllPattern(
          patterns,
          [...currentPattern, card],
          visited,
          hand,
          game,
        );
        visited.delete(card);
      }
    }
    patterns.push(currentPattern);
    return;
  }
}
