import { Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';

// 1. Define the expected structure of the validation error
interface ValidationResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

@Catch(BadRequestException)
export class WsValidationFilter extends BaseWsExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const response = exception.getResponse();

    let errorMessage = 'Validation failed';

    // 2. Type Guard: Check if response is actually an object
    if (typeof response === 'object' && response !== null) {
      const validationResponse = response as ValidationResponse;

      // 3. Handle both array (multiple errors) and string (single error) cases
      if (Array.isArray(validationResponse.message)) {
        errorMessage = validationResponse.message.join(', ');
      } else if (typeof validationResponse.message === 'string') {
        errorMessage = validationResponse.message;
      }
    } else if (typeof response === 'string') {
      errorMessage = response;
    }

    client.emit('validation-error', {
      message: errorMessage,
    });
  }
}
