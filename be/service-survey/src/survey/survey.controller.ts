import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyStatus } from './entities/survey.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';
import { CreateSurveyDto, UpdateSurveyDto } from './dto/survey.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { SubmitResponseDto } from './dto/response.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  // ══════════════════════════════════════════════════════════
  //  USER (Mobile): Mengisi Survey
  // ══════════════════════════════════════════════════════════

  @Get('active')
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.SURVEYOR)
  getActiveSurveys(@Request() req) {
    return this.surveyService.getActiveSurveys(req.user.userId);
  }

  @Get('my-responses')
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.SURVEYOR)
  getMyResponses(@Request() req, @Query() pagination?: PaginationDto) {
    return this.surveyService.getMyResponses(req.user.userId, pagination);
  }

  @Get(':id/fill')
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.SURVEYOR)
  getSurveyForFill(@Param('id') id: string) {
    return this.surveyService.getSurveyForFill(id);
  }

  @Post(':id/responses')
  @Roles(Role.USER, Role.SUPER_ADMIN, Role.SURVEYOR)
  submitResponse(
    @Param('id') id: string,
    @Body() dto: SubmitResponseDto,
    @Request() req,
  ) {
    return this.surveyService.submitResponse(id, req.user.userId, dto);
  }

  // ══════════════════════════════════════════════════════════
  //  ADMIN: CRUD Survey & Pertanyaan
  // ══════════════════════════════════════════════════════════

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  createSurvey(@Body() dto: CreateSurveyDto, @Request() req) {
    return this.surveyService.createSurvey(dto, req.user.userId);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  findAllSurveys(
    @Query('status') status?: SurveyStatus,
    @Query() pagination?: PaginationDto,
  ) {
    return this.surveyService.findAllSurveys(status, pagination);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  findSurveyById(@Param('id') id: string) {
    return this.surveyService.findSurveyById(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  updateSurvey(@Param('id') id: string, @Body() dto: UpdateSurveyDto) {
    return this.surveyService.updateSurvey(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  deleteSurvey(@Param('id') id: string) {
    return this.surveyService.deleteSurvey(id);
  }

  @Post(':id/questions')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  addQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.surveyService.addQuestion(id, dto);
  }

  @Patch(':id/questions/:qId')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  updateQuestion(
    @Param('id') id: string,
    @Param('qId') qId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.surveyService.updateQuestion(id, qId, dto);
  }

  @Delete(':id/questions/:qId')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  deleteQuestion(@Param('id') id: string, @Param('qId') qId: string) {
    return this.surveyService.deleteQuestion(id, qId);
  }

  @Patch(':id/publish')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  publishSurvey(@Param('id') id: string) {
    return this.surveyService.publishSurvey(id);
  }

  @Patch(':id/close')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  closeSurvey(@Param('id') id: string) {
    return this.surveyService.closeSurvey(id);
  }

  @Get(':id/results')
  @Roles(Role.SUPER_ADMIN, Role.SURVEYOR)
  getSurveyResults(@Param('id') id: string) {
    return this.surveyService.getSurveyResults(id);
  }
}
