import { Injectable } from '@nestjs/common';
import { Player } from '../model/player/Player';
import { GameRoom } from '../model/game-room/GameRoom';
import {
  CardPatternMismatch,
  GameBoard,
  TurnEvents,
} from '../model/game-board/GameBoard';
import { randomUUID } from 'crypto';
import { Card, CardColor } from '../model/card/Card';
import {
  NotPlayerTurn,
  CannotDrawCard,
  RoomNotFound,
  CardsSentMustNotBeEmpty,
  HaveNotChoosenColor,
} from '../service-exception/service-exception';
import {
  PublicGameState,
  PublicGamePlayer,
} from '../service-interface/service-interface';
import { AmountGreaterThanDrawPile } from '../model/game-board/GameBoard';

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

  public generateGameState(room: GameRoom): PublicGameState {
    return new PublicGameState(
      room.getCurrentPlayerIndex(),
      this.generatePublicGamePlayers(room),
      room.getDirection(),
      room.getGameBoard().getCurrentTopCard(),
      room.getGameBoard().getEnforcedColor(),
    );
  }

  public generatePublicGamePlayers(room: GameRoom): PublicGamePlayer[] {
    const playerOrder: Player[] = room.getPlayerOrder();
    const publicGamePlayers: PublicGamePlayer[] = [];

    for (const player of playerOrder) {
      publicGamePlayers.push(
        new PublicGamePlayer(
          player.socketId,
          player.username,
          player.getHand(),
          player.isUno(),
        ),
      );
    }

    return publicGamePlayers;
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

  public isPlayerTurn(room: GameRoom, player: Player): boolean {
    const currentPlayer: Player = room.getPlayerFromOrder();

    if (player.socketId !== currentPlayer.socketId) {
      throw new NotPlayerTurn(
        `
          playerId: ${player.socketId}
          currentPlayerTurnId: ${currentPlayer.socketId}
          `,
        {},
      );
    }

    return true;
  }

  public getPlayableCards(hand: Card[], game: GameBoard): Card[] {
    const playableCards: Card[] = [];

    for (const card of hand) {
      if (game.isValidFirstMove(card)) playableCards.push(card);
    }

    return playableCards;
  }

  public drawCards(room: GameRoom, player: Player, amount: number): void {
    const game: GameBoard = room.getGameBoard();
    const playableCards: Card[] = this.getPlayableCards(player.getHand(), game);

    if (playableCards.length !== 0) {
      throw new CannotDrawCard(
        `
        Player have a playable card in hand!
        `,
        { cause: playableCards },
      );
    }

    try {
      player.pushToHand(game.popFromDrawPile(amount));
    } catch (err) {
      if (err instanceof AmountGreaterThanDrawPile) {
        const clearedCards: Card[] = game.clearDiscardPile();
        game.pushToDrawPile(clearedCards);
        game.shuffleDrawPile();
      }
    }
  }

  public hasGameEnded(room: GameRoom): boolean {
    return room.getPlayerOrder().length <= 1;
  }

  public isBotTurn(room: GameRoom, playerSocketId: string): boolean {
    return room.getPlayerFromOrder().socketId !== playerSocketId;
  }

  public playCards(
    room: GameRoom,
    player: Player,
    cardToPlayIds: string[],
    wildColor?: CardColor,
  ): void {
    try {
      const game: GameBoard = room.getGameBoard();

      if (cardToPlayIds.length <= 0) {
        throw new CardsSentMustNotBeEmpty(
          `
          Location: playCards
          Cards length: ${cardToPlayIds.length}
          `,
          {},
        );
      }

      const cardsToPlay: Card[] = player.getCardsToPlay(cardToPlayIds);
      const cardsToPlayTopCardType: string = game.getCardType(
        cardsToPlay[cardsToPlay.length - 1],
      );

      game.processPattern(cardsToPlay);

      if (cardsToPlayTopCardType === 'WILD' && wildColor) {
        game.setEnforcedColor(wildColor);
      }
      if (cardsToPlayTopCardType === 'WILD' && !wildColor) {
        throw new HaveNotChoosenColor(
          `
          topCard: ${cardsToPlay[cardsToPlay.length - 1].name}
          color: ${wildColor}
          `,
          {},
        );
      }

      const removedCards: Card[] = player.removeCards(cardToPlayIds);
      game.pushToDiscardPile(removedCards);

      game.setTurnEvents(removedCards);
      game.setCurrentTopCard(removedCards[removedCards.length - 1]);
    } catch (err) {
      if (err instanceof CardsSentMustNotBeEmpty) throw err;
      if (err instanceof HaveNotChoosenColor) throw err;
      if (err instanceof CardPatternMismatch) throw err;
    }
  }

  // ONLY WORKS WHEN PLAYER IS REMOVED FIRST
  public setNewCurrentPlayerIndex(
    room: GameRoom,
    removedPlayerIndex: number | null,
  ): void {
    const direction: number = room.getDirection();
    const maxIndex: number = room.getPlayerOrder().length - 1;
    let currentIndex: number = room.getCurrentPlayerIndex();

    if (removedPlayerIndex === null) return;

    if (removedPlayerIndex === currentIndex) {
      // KEEP currentIndex WHEN ARRAY SPLICE AND INDEX IS NOT OUT OF BOUND
      // RESET TO 0 IF OUT OF BOUND
      if (direction === 1 && currentIndex > maxIndex) {
        currentIndex = 0;
      }

      // DECREMENT currentIndex BY DEFAULT WHEN ARRAY SPLICE
      // SET currentIndex = maxIndex WHEN ITS OUT OF BOUND
      if (direction === -1 && currentIndex <= 0) {
        currentIndex = maxIndex;
      } else if (direction === -1) currentIndex--;

      // SHIFT THE INDEX IF THE REMOVED PLAYER IS BEHIND THE CURRENT PLAYER
    } else if (removedPlayerIndex < currentIndex) {
      currentIndex--;
    }

    room.setCurrentPlayerIndex(currentIndex);
  }

  public processCurrentTurn(room: GameRoom): boolean {
    const currentPlayer: Player = room.getPlayerFromOrder();
    const hand: Card[] = currentPlayer.getHand();
    const zeroOrOneCardLeftOnHand = hand.length === 0 || hand.length === 1;

    if (zeroOrOneCardLeftOnHand && currentPlayer.isUno() === false) {
      this.drawCards(room, currentPlayer, 2);
    }
    if (hand.length === 0 && currentPlayer.isUno() === true) {
      const currentIndex: number = room.getCurrentPlayerIndex();
      room.removeFromPlayerOrder(currentPlayer.socketId);
      this.setNewCurrentPlayerIndex(room, currentIndex);
      return true;
    }

    currentPlayer.setIsUno(false);

    return false;
  }

  public processNextTurn(room: GameRoom): void {
    this.updateDirection(room);
    this.updateCurrentPlayerIndex(room);
    const nextPlayer: Player = room.getPlayerFromOrder();
    const game: GameBoard = room.getGameBoard();
    const { draw_two_amount, wild_draw_four_amount }: TurnEvents =
      game.getTurnEvents();

    if (draw_two_amount) {
      this.drawCards(room, nextPlayer, draw_two_amount * 2);
    }
    if (wild_draw_four_amount) {
      this.drawCards(room, nextPlayer, wild_draw_four_amount * 4);
    }
  }

  public updateDirection(room: GameRoom): void {
    let direction: number = room.getDirection();
    let { reverse_amount }: TurnEvents = room.getGameBoard().getTurnEvents();

    while (reverse_amount) {
      if (direction === 1) direction = -1;
      else if (direction === -1) direction = 1;
      reverse_amount--;
    }

    room.setDirection(direction);
  }

  public updateCurrentPlayerIndex(room: GameRoom): void {
    let currentIndex: number = room.getCurrentPlayerIndex();
    let { skip_amount }: TurnEvents = room.getGameBoard().getTurnEvents();
    const direction: number = room.getDirection();
    const playerOrder: Player[] = room.getPlayerOrder();

    while (skip_amount) {
      if (direction === 1) {
        if (currentIndex === playerOrder.length - 1) currentIndex = 0;
        else currentIndex++;
      }
      if (direction === -1) {
        if (currentIndex === 0) currentIndex = playerOrder.length - 1;
        else currentIndex--;
      }
      skip_amount--;
    }

    // UPDATE THE INDEX BY DEFAULT (FOR NON-SKIP AND SKIPS)
    if (direction === 1) {
      if (currentIndex === playerOrder.length - 1) currentIndex = 0;
      else currentIndex++;
    }
    if (direction === -1) {
      if (currentIndex === 0) currentIndex = playerOrder.length - 1;
      else currentIndex--;
    }

    room.setCurrentPlayerIndex(currentIndex);
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
