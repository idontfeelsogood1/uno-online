import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  PlayerIsInARoom,
  RoomNotFound,
  RoomIsFull,
  RoomHasStarted,
  PlayerNotInAnyRoom,
  NotRoomOwner,
  PlayersCountMustBeGreaterThanOne,
  RoomHasNotStarted,
} from '../game.service';
import { PlayerNotFound } from '../class/game-room/GameRoom';

@Catch(
  PlayerIsInARoom,
  RoomNotFound,
  RoomIsFull,
  RoomHasStarted,
  PlayerNotFound,
  PlayerNotInAnyRoom,
  NotRoomOwner,
  PlayersCountMustBeGreaterThanOne,
  RoomHasNotStarted,
)
export class WsRoomFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Default fallback
    const eventName = 'room-exception';
    let message = 'Unknown error';

    // Map Error Class -> Event Name & Message
    if (exception instanceof PlayerIsInARoom) {
      message = 'Player is already in a room.';
    }
    if (exception instanceof RoomNotFound) {
      message = 'Room not found.';
    }
    if (exception instanceof RoomIsFull) {
      message = 'Room is full.';
    }
    if (exception instanceof RoomHasStarted) {
      message = 'Room has already started game.';
    }
    if (exception instanceof RoomHasNotStarted) {
      message = 'Room has not started game.';
    }
    if (exception instanceof PlayerNotInAnyRoom) {
      message = 'Player is not in any room.';
    }
    if (exception instanceof PlayerNotFound) {
      message = 'Player not found.';
    }
    if (exception instanceof NotRoomOwner) {
      message = 'Not room owner.';
    }
    if (exception instanceof PlayersCountMustBeGreaterThanOne) {
      message = 'Player count must be greater than one.';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message: message });
  }
}
