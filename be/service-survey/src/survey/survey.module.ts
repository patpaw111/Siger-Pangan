import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';

import { Survey } from './entities/survey.entity';
import { SurveyQuestion } from './entities/survey-question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { SurveyResponse } from './entities/survey-response.entity';
import { ResponseAnswer } from './entities/response-answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey,
      SurveyQuestion,
      QuestionOption,
      SurveyResponse,
      ResponseAnswer,
    ]),
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
})
export class SurveyModule {}
