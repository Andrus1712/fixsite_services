import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from 'src/entities/global/tenant.entity';
import { StatsService } from '../inventory/store/stats.service';
import {
  tenantRoom,
  userRoom,
  chatRoom,
  RealtimeEvents,
  NotificationPayload,
  ChatMessagePayload,
  InventoryStats,
} from './realtime.types';

@Injectable()
export class RealtimeService {
  private server!: Server;

  constructor(
    private readonly statsService: StatsService,
    @InjectRepository(Tenant, 'globalConnection')
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /** Called by the gateway once it boots */
  setServer(server: Server) {
    this.server = server;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { id: tenantId } });
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async emitStats(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;
    const stats = await this.statsService.getInventoryStats(tenant);
    this.server.to(tenantRoom(tenantId)).emit(RealtimeEvents.STATS_UPDATE, stats);
  }

  async emitStatsTest(tenantId: string, data): Promise<void> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;
    this.server.to(tenantRoom(tenantId)).emit(RealtimeEvents.STATS_UPDATE, data);
  }

  async getStats(tenant: Tenant): Promise<InventoryStats> {
    return this.statsService.getInventoryStats(tenant);
  }

  // ─── Notifications ──────────────────────────────────────────────────────────

  /**
   * Send to a specific user or broadcast to the whole tenant.
   * Usage from any service:
   *   realtimeService.sendNotification(tenantId, { userId, type, title, body })
   */
  sendNotification(tenantId: string, payload: NotificationPayload): void {
    const room = payload.userId ? userRoom(payload.userId) : tenantRoom(tenantId);
    this.server.to(room).emit(RealtimeEvents.NOTIFICATION_NEW, payload);
  }

  // ─── Chat ───────────────────────────────────────────────────────────────────

  sendChatMessage(payload: ChatMessagePayload): void {
    this.server.to(chatRoom(payload.chatId)).emit(RealtimeEvents.CHAT_MESSAGE, payload);
  }
}
