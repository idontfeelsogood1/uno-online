import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  PlayerIsInARoom,
  RoomNotFound,
  RoomIsFull,
  RoomHasStarted,
} from '../game.service';

@Catch(PlayerIsInARoom, RoomNotFound, RoomIsFull, RoomHasStarted)
export class WsRoomFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Default fallback
    let eventName = 'error';
    let message = 'Unknown error';

    // Map Error Class -> Event Name & Message
    if (exception instanceof PlayerIsInARoom) {
      eventName = 'player-already-in-a-room';
      message = 'Player is already in a room';
    }
    if (exception instanceof RoomNotFound) {
      eventName = 'room-not-found';
      message = 'Room not found';
    }
    if (exception instanceof RoomIsFull) {
      eventName = 'room-is-full';
      message = 'Room is full';
    }
    if (exception instanceof RoomHasStarted) {
      eventName = 'room-has-started';
      message = 'Room has already started';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message });
  }
}
