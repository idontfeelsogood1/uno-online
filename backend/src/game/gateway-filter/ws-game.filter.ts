import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  NotPlayerTurn,
  CardsSentMustNotBeEmpty,
  CannotUno,
  HaveNotChoosenColor,
  CannotDrawCard,
} from '../service-exception/service-exception';
import { CardPatternMismatch } from '../model/game-board/GameBoard';

// UNCAUGHT: AmountGreaterThanDrawPile, PlayerWon
@Catch(
  NotPlayerTurn,
  CardsSentMustNotBeEmpty,
  CannotUno,
  HaveNotChoosenColor,
  CardPatternMismatch,
  CannotDrawCard,
)
export class WsGameFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Default fallback
    const eventName = 'game-exception';
    let message = 'Unknown error';

    // Map Error Class -> Event Name & Message
    if (exception instanceof NotPlayerTurn) {
      message = 'Not Player Turn.';
    }
    if (exception instanceof CardsSentMustNotBeEmpty) {
      message = 'Cards send must not be empty.';
    }
    if (exception instanceof CannotUno) {
      message = 'Cannot uno.';
    }
    if (exception instanceof HaveNotChoosenColor) {
      message = 'Must choose a color if wild card is played on top of gabd.';
    }
    if (exception instanceof CardPatternMismatch) {
      message = 'Card pattern mismatch.';
    }
    if (exception instanceof CannotDrawCard) {
      message = 'Player have playable cards in hand.';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message: message });
  }
}
