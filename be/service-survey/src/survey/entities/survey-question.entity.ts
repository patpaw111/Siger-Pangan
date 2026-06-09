import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Survey } from './survey.entity';
import { QuestionOption } from './question-option.entity';
import { ResponseAnswer } from './response-answer.entity';

export enum QuestionType {
  TEXT = 'text',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  NUMBER = 'number',
  RATING = 'rating',
}

@Entity('survey_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.TEXT,
  })
  questionType: QuestionType;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  /** Metadata tambahan (placeholder, min, max, step, dll.) */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ── Relations ──────────────────────────────────────────────
  @ManyToOne(() => Survey, (s) => s.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => QuestionOption, (o) => o.question, { cascade: true })
  options: QuestionOption[];

  @OneToMany(() => ResponseAnswer, (a) => a.question)
  answers: ResponseAnswer[];
}
