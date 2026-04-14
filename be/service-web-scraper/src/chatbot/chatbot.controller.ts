import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { IsString, IsNotEmpty } from 'class-validator';

class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body(new ValidationPipe()) body: ChatRequestDto) {
    // Generate a simple session ID for stateless simulation.
    // In a real app, this might come from auth token or provided by client.
    const sessionId = `sess_${Date.now()}`;
    return this.chatbotService.processChat(sessionId, body.text);
  }
}
