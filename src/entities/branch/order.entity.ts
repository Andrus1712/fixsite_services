import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, In, BeforeInsert, DataSource } from 'typeorm';
import { Customer } from './customer.entity';
import { Technician } from './technician.entity';
import { Device } from './device.entity';
import { Issue } from './issue.entity';
import { Part } from './part.entity';
import { StatusHistory } from './status-history.entity';
import { Note } from './note.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_code: string;

  @Column('text')
  description: string;

  @Column()
  status: number;

  @Column()
  status_description: string;

  @Column()
  priority: number;

  @Column()
  priority_description: string;

  @Column()
  customer_id: number;

  @Column({ nullable: true })
  assigned_technician_id: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimated_cost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actual_cost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  labor_cost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  parts_cost: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: false })
  cost_approved: boolean;

  @Column({ type: 'date', nullable: true })
  quote_valid_until: Date;

  @Column({ type: 'date', nullable: true })
  estimated_completion: Date;

  @Column({ type: 'date', nullable: true })
  actual_completion: Date;

  @Column({ nullable: true })
  estimated_hours: number;

  @Column({ nullable: true })
  actual_hours: number;

  @Column({ type: 'date', nullable: true })
  sla_deadline: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Technician)
  @JoinColumn({ name: 'assigned_technician_id' })
  technician: Technician;

  @OneToMany(() => Device, device => device.order)
  devices: Device[];

  @OneToMany(() => Issue, issue => issue.order)
  issues: Issue[];

  @OneToMany(() => Part, part => part.order)
  parts: Part[];

  @OneToMany(() => StatusHistory, history => history.order)
  status_history: StatusHistory[];

  @OneToMany(() => Note, note => note.order)
  notes: Note[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @BeforeInsert()
  // async generateOrderCode() {
  //   const dataSource = this.constructor['dataSource'] as DataSource;
  //   const repo = dataSource.getRepository(Order);
  //   const prefix = '1-';

  //   // 1. Obtener la fecha en formato YYYYMMDD
  //   const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Por ejemplo: 20251117

  //   const searchPattern = `${prefix}${datePart}-%`; // Patrón de búsqueda: '1-20251117-%'

  //   // 2. Buscar el último código de orden del día
  //   const lastOrder = await repo.findOne({
  //     where: {
  //       order_code: In([searchPattern]), // Usar 'In' o la cláusula 'like' de la base de datos
  //     },
  //     order: {
  //       order_code: 'DESC', // Ordenar descendente para obtener el más alto
  //     },
  //   });

  //   let nextSequence = 1;

  //   if (lastOrder) {
  //     // 3. Si existe, extraer y calcular la siguiente secuencia
  //     // Ejemplo: '1-20251117-00005' -> se extrae '00005'
  //     const lastCode = lastOrder.order_code;
  //     const sequenceString = lastCode.split('-').pop(); // Obtiene '00005'
  //     if (sequenceString) {
  //       const lastSequence = parseInt(sequenceString, 10);
  //       nextSequence = lastSequence + 1;
  //     }
  //   }

  //   // 4. Formatear la secuencia (asegurar que tenga 5 dígitos, por ejemplo '00001')
  //   const formattedSequence = nextSequence.toString().padStart(5, '0');

  //   // 5. Establecer el order_code
  //   this.order_code = `${prefix}${datePart}-${formattedSequence}`;
  // }
}