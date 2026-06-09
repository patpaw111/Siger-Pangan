import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Survey, SurveyStatus } from './entities/survey.entity';
import { SurveyQuestion } from './entities/survey-question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { SurveyResponse, ResponseStatus } from './entities/survey-response.entity';
import { ResponseAnswer } from './entities/response-answer.entity';

import { CreateSurveyDto, UpdateSurveyDto } from './dto/survey.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { SubmitResponseDto } from './dto/response.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(QuestionOption)
    private readonly optionRepo: Repository<QuestionOption>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    @InjectRepository(ResponseAnswer)
    private readonly answerRepo: Repository<ResponseAnswer>,
    private readonly dataSource: DataSource,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  ADMIN: CRUD Survey
  // ══════════════════════════════════════════════════════════

  async createSurvey(dto: CreateSurveyDto, userId: string): Promise<Survey> {
    const survey = this.surveyRepo.create({
      title: dto.title,
      description: dto.description,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      createdBy: userId,
      status: SurveyStatus.DRAFT,
    });
    return this.surveyRepo.save(survey);
  }

  async findAllSurveys(status?: SurveyStatus, pagination?: PaginationDto): Promise<PaginatedResult<Survey>> {
    const limit = pagination?.limit ? Number(pagination.limit) : 10;
    const page = pagination?.page ? Number(pagination.page) : 1;
    const skip = (page - 1) * limit;

    const qb = this.surveyRepo
      .createQueryBuilder('s')
      .orderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      qb.where('s.status = :status', { status });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSurveyById(id: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { id },
      relations: {
        questions: {
          options: true,
        },
      },
      order: { questions: { sortOrder: 'ASC', options: { sortOrder: 'ASC' } } },
    });
    if (!survey) throw new NotFoundException('Survey tidak ditemukan');
    return survey;
  }

  async updateSurvey(id: string, dto: UpdateSurveyDto): Promise<Survey> {
    const survey = await this.findSurveyById(id);

    if (dto.title !== undefined) survey.title = dto.title;
    if (dto.description !== undefined) survey.description = dto.description;
    if (dto.startsAt !== undefined) survey.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) survey.endsAt = new Date(dto.endsAt);

    return this.surveyRepo.save(survey);
  }

  async deleteSurvey(id: string): Promise<void> {
    const survey = await this.findSurveyById(id);
    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException(
        'Hanya survey berstatus "draft" yang bisa dihapus',
      );
    }
    await this.surveyRepo.remove(survey);
  }

  async publishSurvey(id: string): Promise<Survey> {
    const survey = await this.findSurveyById(id);
    if (survey.status !== SurveyStatus.DRAFT) {
      throw new BadRequestException('Survey hanya bisa dipublish dari status "draft"');
    }
    if (!survey.questions || survey.questions.length === 0) {
      throw new BadRequestException('Survey harus memiliki minimal 1 pertanyaan');
    }
    
    survey.status = SurveyStatus.PUBLISHED;
    const savedSurvey = await this.surveyRepo.save(survey);

    // ────────────────────────────────────────────────────────
    //  Trigger Notifikasi In-App ke Semua Pengguna (Role: USER)
    // ────────────────────────────────────────────────────────
    try {
      // Menggunakan pendekatan INSERT ... SELECT untuk Bulk Insert super cepat via Raw Query
      // Langsung mengekstrak target UUID dari tabel users di database yang sama.
      await this.dataSource.query(`
        INSERT INTO notifications (id, user_id, title, body, type, reference_id, is_read, created_at)
        SELECT 
          gen_random_uuid(), 
          id, 
          $1, 
          $2, 
          'SURVEY_NEW', 
          $3, 
          false, 
          NOW()
        FROM users 
        WHERE role = 'USER'
      `, [
        `Tersedia Survey Baru: ${survey.title}`,
        `Dinas Ketahanan Pangan baru saja merilis survey baru. Yuk, berpartisipasi untuk membantu kami!`,
        survey.id
      ]);
      
      this.logger.log(`✅ Berhasil mengirim notifikasi "Survey Baru" untuk survey: ${survey.id}`);
    } catch (err) {
      this.logger.error(`❌ Gagal mengirim notifikasi survey: ${err.message}`);
      // Tidak me-throw error agar proses publish tetap berhasil meskipun notifikasi gagal
    }

    return savedSurvey;
  }

  async closeSurvey(id: string): Promise<Survey> {
    const survey = await this.findSurveyById(id);
    if (survey.status !== SurveyStatus.PUBLISHED) {
      throw new BadRequestException('Hanya survey "published" yang bisa ditutup');
    }
    survey.status = SurveyStatus.CLOSED;
    return this.surveyRepo.save(survey);
  }

  // ══════════════════════════════════════════════════════════
  //  ADMIN: CRUD Pertanyaan
  // ══════════════════════════════════════════════════════════

  async addQuestion(surveyId: string, dto: CreateQuestionDto): Promise<SurveyQuestion> {
    await this.findSurveyById(surveyId); // pastikan survey ada

    const question = this.questionRepo.create({
      surveyId,
      questionText: dto.questionText,
      questionType: dto.questionType,
      sortOrder: dto.sortOrder ?? 0,
      isRequired: dto.isRequired ?? true,
      metadata: dto.metadata ?? null,
    });

    const savedQuestion = await this.questionRepo.save(question);

    // Simpan opsi jika ada
    if (dto.options && dto.options.length > 0) {
      const options = dto.options.map((o, idx) =>
        this.optionRepo.create({
          questionId: savedQuestion.id,
          label: o.label,
          value: o.value ?? o.label,
          sortOrder: o.sortOrder ?? idx,
        }),
      );
      savedQuestion.options = await this.optionRepo.save(options);
    }

    return savedQuestion;
  }

  async updateQuestion(
    surveyId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ): Promise<SurveyQuestion> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, surveyId },
      relations: { options: true },
    });
    if (!question) throw new NotFoundException('Pertanyaan tidak ditemukan');

    if (dto.questionText !== undefined) question.questionText = dto.questionText;
    if (dto.questionType !== undefined) question.questionType = dto.questionType;
    if (dto.sortOrder !== undefined) question.sortOrder = dto.sortOrder;
    if (dto.isRequired !== undefined) question.isRequired = dto.isRequired;
    if (dto.metadata !== undefined) question.metadata = dto.metadata;

    const savedQuestion = await this.questionRepo.save(question);

    // Jika ada opsi baru, hapus yang lama lalu ganti
    if (dto.options !== undefined) {
      await this.optionRepo.delete({ questionId });
      if (dto.options.length > 0) {
        const options = dto.options.map((o, idx) =>
          this.optionRepo.create({
            questionId,
            label: o.label,
            value: o.value ?? o.label,
            sortOrder: o.sortOrder ?? idx,
          }),
        );
        savedQuestion.options = await this.optionRepo.save(options);
      }
    }

    return savedQuestion;
  }

  async deleteQuestion(surveyId: string, questionId: string): Promise<void> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, surveyId },
    });
    if (!question) throw new NotFoundException('Pertanyaan tidak ditemukan');
    await this.questionRepo.remove(question);
  }

  // ══════════════════════════════════════════════════════════
  //  USER (Mobile): Mengisi Survey
  // ══════════════════════════════════════════════════════════

  async getActiveSurveys(userId: string): Promise<any[]> {
    const now = new Date();

    const surveys = await this.surveyRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SurveyStatus.PUBLISHED })
      .andWhere('(s.starts_at IS NULL OR s.starts_at <= :now)', { now })
      .andWhere('(s.ends_at IS NULL OR s.ends_at >= :now)', { now })
      .orderBy('s.createdAt', 'DESC')
      .getMany();

    // Tandai survey yang sudah dijawab user ini
    const respondedSurveyIds = await this.responseRepo
      .createQueryBuilder('r')
      .select('r.survey_id')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.status = :status', { status: ResponseStatus.SUBMITTED })
      .getRawMany();

    const answeredIds = new Set(respondedSurveyIds.map((r) => r.survey_id));

    return surveys.map((s) => ({
      ...s,
      isAnswered: answeredIds.has(s.id),
    }));
  }

  async getSurveyForFill(id: string): Promise<Survey> {
    return this.findSurveyById(id);
  }

  async submitResponse(
    surveyId: string,
    userId: string,
    dto: SubmitResponseDto,
  ): Promise<SurveyResponse> {
    // Pastikan survey aktif
    const survey = await this.findSurveyById(surveyId);
    if (survey.status !== SurveyStatus.PUBLISHED) {
      throw new BadRequestException('Survey ini tidak sedang aktif');
    }

    // Cek duplikasi: user sudah pernah mengisi?
    const existing = await this.responseRepo.findOne({
      where: { surveyId, userId },
    });
    if (existing) {
      throw new ConflictException('Anda sudah pernah mengisi survey ini');
    }

    // Validasi: semua required question harus dijawab
    const requiredQuestionIds = survey.questions
      .filter((q) => q.isRequired)
      .map((q) => q.id);

    const answeredQuestionIds = new Set(dto.answers.map((a) => a.questionId));
    const missingQuestions = requiredQuestionIds.filter(
      (qId) => !answeredQuestionIds.has(qId),
    );
    if (missingQuestions.length > 0) {
      throw new BadRequestException(
        `Pertanyaan wajib belum dijawab: ${missingQuestions.length} pertanyaan`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Simpan response
      const response = queryRunner.manager.create(SurveyResponse, {
        surveyId,
        userId,
        status: ResponseStatus.SUBMITTED,
        submittedAt: new Date(),
      });
      const savedResponse = await queryRunner.manager.save(response);

      // Simpan jawaban
      const answers = dto.answers.map((a) =>
        queryRunner.manager.create(ResponseAnswer, {
          responseId: savedResponse.id,
          questionId: a.questionId,
          answerText: a.answerText ?? null,
          selectedOptions: a.selectedOptions ?? null,
        }),
      );
      savedResponse.answers = await queryRunner.manager.save(answers);

      await queryRunner.commitTransaction();
      this.logger.log(`✅ User ${userId} berhasil mengisi survey "${survey.title}" secara atomic`);
      return savedResponse;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Gagal menyimpan jawaban survey: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyResponses(userId: string, pagination?: PaginationDto): Promise<PaginatedResult<SurveyResponse>> {
    const limit = pagination?.limit ? Number(pagination.limit) : 10;
    const page = pagination?.page ? Number(pagination.page) : 1;
    const skip = (page - 1) * limit;

    const [data, total] = await this.responseRepo.findAndCount({
      where: { userId },
      relations: { survey: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ══════════════════════════════════════════════════════════
  //  ADMIN: Hasil & Statistik
  // ══════════════════════════════════════════════════════════

  async getSurveyResults(surveyId: string): Promise<{
    survey: Survey;
    totalResponses: number;
    questions: any[];
  }> {
    const survey = await this.findSurveyById(surveyId);

    const totalResponses = await this.responseRepo.count({
      where: { surveyId, status: ResponseStatus.SUBMITTED },
    });

    const questions: any[] = [];

    for (const question of survey.questions) {
      let summary: any;

      switch (question.questionType) {
        case 'text': {
          // Tetap ambil teks mentah untuk teks (dengan limit jika sangat banyak, disini tanpa limit tapi hanya IS NOT NULL)
          const textAnswers = await this.answerRepo
            .createQueryBuilder('a')
            .select('a.answer_text', 'text')
            .where('a.question_id = :qId', { qId: question.id })
            .andWhere('a.answer_text IS NOT NULL')
            .getRawMany();
            
          summary = {
            type: 'text',
            responses: textAnswers.map((row) => row.text).filter(Boolean),
          };
          break;
        }

        case 'number':
        case 'rating': {
          // SQL Aggregation
          const stats = await this.answerRepo
            .createQueryBuilder('a')
            .select('COUNT(a.id)', 'count')
            .addSelect('AVG(CAST(a.answer_text AS FLOAT))', 'avg')
            .addSelect('MIN(CAST(a.answer_text AS FLOAT))', 'min')
            .addSelect('MAX(CAST(a.answer_text AS FLOAT))', 'max')
            .where('a.question_id = :qId', { qId: question.id })
            .andWhere('a.answer_text IS NOT NULL')
            .getRawOne();

          summary = {
            type: question.questionType,
            count: Number(stats.count) || 0,
            average: stats.avg ? Math.round(Number(stats.avg) * 100) / 100 : 0,
            min: stats.min !== null ? Number(stats.min) : null,
            max: stats.max !== null ? Number(stats.max) : null,
          };
          break;
        }

        case 'single_choice':
        case 'multiple_choice': {
          // SQL JSONB Aggregation / Unnesting
          // Untuk mendapatkan frekuensi masing-masing opsi yang dipilih
          const distributionRaw = await this.answerRepo.query(
            `
            SELECT option_id, COUNT(*) as count
            FROM (
              SELECT jsonb_array_elements_text(selected_options) AS option_id
              FROM response_answers
              WHERE question_id = $1 AND selected_options IS NOT NULL
            ) as unnested
            GROUP BY option_id
            `,
            [question.id],
          );

          // Peta opsi ke struktur awal
          const optionCounts: Record<string, number> = {};
          for (const opt of question.options) {
            optionCounts[opt.id] = 0;
          }
          
          for (const row of distributionRaw) {
            if (optionCounts[row.option_id] !== undefined) {
              optionCounts[row.option_id] = Number(row.count);
            }
          }

          summary = {
            type: question.questionType,
            distribution: question.options.map((opt) => ({
              optionId: opt.id,
              label: opt.label,
              count: optionCounts[opt.id] ?? 0,
              percentage:
                totalResponses > 0
                  ? Math.round(((optionCounts[opt.id] ?? 0) / totalResponses) * 10000) / 100
                  : 0,
            })),
          };
          break;
        }
      }

      questions.push({
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        sortOrder: question.sortOrder,
        summary,
      });
    }

    return { survey, totalResponses, questions };
  }
}
