import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  NotPlayerTurn,
  CardsSentMustNotBeEmpty,
  CannotUno,
  HaveNotChoosenColor,
} from '../game.service';
import {
  EnforcedColorMismatch,
  CardTypeMismatch,
  CardPatternMismatch,
} from '../class/game-board/GameBoard';

// UNCAUGHT: AmountGreaterThanDrawPile, PlayerWon
@Catch(
  NotPlayerTurn,
  CardsSentMustNotBeEmpty,
  CannotUno,
  HaveNotChoosenColor,
  EnforcedColorMismatch,
  CardTypeMismatch,
  CardPatternMismatch,
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
    if (exception instanceof EnforcedColorMismatch) {
      message = 'Enforced color mismatch.';
    }
    if (exception instanceof CardTypeMismatch) {
      message = 'Can only play 1 type per hand.';
    }
    if (exception instanceof CardPatternMismatch) {
      message = 'Card pattern mismatch.';
    }

    // Emit the specific event to the frontend
    client.emit(eventName, { message: message });
  }
}
