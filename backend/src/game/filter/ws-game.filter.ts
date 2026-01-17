import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { NotPlayerTurn } from '../game.service';

@Catch(NotPlayerTurn)
export class WsGameFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Default fallback
    let eventName = 'error';
    let message = 'Unknown error';

    // Map Error Class -> Event Name & Message
    if (exception instanceof NotPlayerTurn) {
      eventName = 'not-player-turn';
      message = 'Not Player Turn.';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message: message });
  }
}
