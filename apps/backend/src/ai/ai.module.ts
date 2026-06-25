import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAIModule } from '../openai/openai.module';
import { ClaudeModule } from '../claude/claude.module';

@Module({
  imports: [OpenAIModule, ClaudeModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
