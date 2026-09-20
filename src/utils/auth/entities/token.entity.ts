import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../../core/users/entities/user.entity';

@Entity({ name: 'tokens' })
export class Token {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_Token',
  })
  id: string;

  @Column({ name: 'verified', type: 'boolean', default: false })
  verified: boolean;

  @Column({ name: 'verify_token', type: 'varchar', nullable: true })
  verifyToken: string | null;

  @Column({ name: 'password_token', type: 'varchar', nullable: true })
  passwordToken: string | null;

  @OneToOne(() => User, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_Token_User',
  })
  user: User;
}
