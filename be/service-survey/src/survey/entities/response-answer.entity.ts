import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SurveyResponse } from './survey-response.entity';
import { SurveyQuestion } from './survey-question.entity';

@Entity('response_answers')
export class ResponseAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'response_id', type: 'uuid' })
  responseId: string;

  @Index()
  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  /** Jawaban teks bebas (untuk tipe text, number, rating) */
  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answerText: string | null;

  /** Array UUID option yang dipilih (untuk single_choice / multiple_choice) */
  @Column({ name: 'selected_options', type: 'jsonb', nullable: true })
  selectedOptions: string[] | null;

  // ── Relations ──────────────────────────────────────────────
  @ManyToOne(() => SurveyResponse, (r) => r.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @ManyToOne(() => SurveyQuestion, (q) => q.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;
}
