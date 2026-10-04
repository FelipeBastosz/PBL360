import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('behavior_tags')
export class BehaviorTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tutor_id', type: 'uuid', nullable: true, default: null })
  tutorId: string | null;

  @Column({ type: 'varchar', length: 80 })
  nome: string;

  @Column({ type: 'boolean', default: true })
  ativa: boolean;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  static create(props: NewBehaviorTag): BehaviorTag {
    const tag = new BehaviorTag();
    tag.tutorId = props.tutorId ?? null;
    tag.nome = props.nome.trim();
    tag.ativa = true;
    return tag;
  }

  isPredefined(): boolean {
    return this.tutorId === null;
  }

  deactivate(): void {
    this.ativa = false;
  }
}

export interface NewBehaviorTag {
  tutorId?: string | null;
  nome: string;
}
