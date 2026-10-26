import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('disciplines')
@Unique('uq_disciplines_code', ['code'])
export class Discipline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  static create(props: NewDiscipline): Discipline {
    const discipline = new Discipline();
    discipline.code = props.code.trim().toUpperCase();
    discipline.name = props.name.trim();
    return discipline;
  }
}

export interface NewDiscipline {
  code: string;
  name: string;
}
