import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Survey } from './survey.entity';
import { ResponseAnswer } from './response-answer.entity';

export enum ResponseStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}

@Entity('survey_responses')
@Unique(['surveyId', 'userId']) // Satu user hanya bisa mengisi satu kali per survey
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId: string;

  /** UUID user yang mengisi survey */
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.SUBMITTED,
  })
  status: ResponseStatus;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ── Relations ──────────────────────────────────────────────
  @ManyToOne(() => Survey, (s) => s.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @OneToMany(() => ResponseAnswer, (a) => a.response, { cascade: true })
  answers: ResponseAnswer[];
}
