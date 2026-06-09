import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum NotificationType {
  SURVEY_NEW = 'SURVEY_NEW',
  PRICE_ALERT = 'PRICE_ALERT',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Index()
  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType;

  // UUID dari referensi terkait (misal ID Survey) agar bisa di-redirect
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Index()
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
