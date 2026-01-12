import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  PlayerIsInARoom,
  RoomNotFound,
  RoomIsFull,
  RoomHasStarted,
  PlayerNotInAnyRoom,
} from '../game.service';
import { PlayerNotFound } from '../class/game-room/GameRoom';

@Catch(
  PlayerIsInARoom,
  RoomNotFound,
  RoomIsFull,
  RoomHasStarted,
  PlayerNotFound,
  PlayerNotInAnyRoom,
)
export class WsRoomFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Default fallback
    let eventName = 'error';
    let message = 'Unknown error';

    // Map Error Class -> Event Name & Message
    if (exception instanceof PlayerIsInARoom) {
      eventName = 'player-already-in-a-room';
      message = 'Player is already in a room.';
    }
    if (exception instanceof RoomNotFound) {
      eventName = 'room-not-found';
      message = 'Room not found.';
    }
    if (exception instanceof RoomIsFull) {
      eventName = 'room-is-full';
      message = 'Room is full.';
    }
    if (exception instanceof RoomHasStarted) {
      eventName = 'room-has-started';
      message = 'Room has already started.';
    }
    if (exception instanceof PlayerNotInAnyRoom) {
      eventName = 'player-not-in-any-room';
      message = 'Player is not in any room.';
    }
    if (exception instanceof PlayerNotFound) {
      eventName = 'player-not-found';
      message = 'Player not found.';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message: message });
  }
}
