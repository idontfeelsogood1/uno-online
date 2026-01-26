import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  NotPlayerTurn,
  CardsSentMustNotBeEmpty,
  CannotUno,
} from '../game.service';

// UNCAUGHT: AmountGreaterThanDrawPile, PlayerWon
@Catch(NotPlayerTurn, CardsSentMustNotBeEmpty, CannotUno)
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
    if (exception instanceof CardsSentMustNotBeEmpty) {
      eventName = 'cards-sent-must-not-be-empty';
      message = 'Cards send must not be empty.';
    }
    if (exception instanceof CannotUno) {
      eventName = 'cannot-uno';
      message = 'Cannot uno.';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message: message });
  }
}
