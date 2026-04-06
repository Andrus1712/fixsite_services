import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';
import {
  tenantRoom,
  userRoom,
  chatRoom,
  RealtimeEvents,
} from './realtime.types';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly realtimeService: RealtimeService) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
  }

  handleConnection(client: Socket) {
    console.log(`[Realtime] connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Realtime] disconnected: ${client.id}`);
  }

  // ─── Join / Leave tenant + user rooms ───────────────────────────────────────

  @SubscribeMessage(RealtimeEvents.JOIN)
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; userId: string },
  ) {
    const tenant = await this.realtimeService.getTenant(data.tenantId);
    
    if (!tenant) {
      client.emit(RealtimeEvents.STATS_ERROR, { message: 'Tenant no encontrado' });
      return;
    }
    client.emit(RealtimeEvents.CONNECTED, { message: 'Conectado al socket', tenantId: data.tenantId, userId: data.userId, clientId: client.id });

    // Join tenant-wide room and personal user room
    await client.join(tenantRoom(data.tenantId));
    await client.join(userRoom(data.userId));

    // Send initial stats right away
    const stats = await this.realtimeService.getStats(tenant);
    client.emit(RealtimeEvents.STATS_UPDATE, stats);
  }

  @SubscribeMessage(RealtimeEvents.LEAVE)
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string; userId: string },
  ) {
    await client.leave(tenantRoom(data.tenantId));
    await client.leave(userRoom(data.userId));
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  @SubscribeMessage(RealtimeEvents.STATS_REQUEST)
  async handleStatsRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    const tenant = await this.realtimeService.getTenant(data.tenantId);
    if (!tenant) return;
    const stats = await this.realtimeService.getStats(tenant);
    client.emit(RealtimeEvents.STATS_UPDATE, stats);
  }

  // ─── Chat ───────────────────────────────────────────────────────────────────

  @SubscribeMessage(RealtimeEvents.CHAT_JOIN)
  async handleChatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    await client.join(chatRoom(data.chatId));
  }

  @SubscribeMessage(RealtimeEvents.CHAT_LEAVE)
  async handleChatLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    await client.leave(chatRoom(data.chatId));
  }

  @SubscribeMessage(RealtimeEvents.CHAT_MESSAGE)
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string; message: string },
  ) {
    const payload = { ...data, createdAt: new Date().toISOString() };
    // Broadcast to everyone in the chat room (including sender)
    this.server.to(chatRoom(data.chatId)).emit(RealtimeEvents.CHAT_MESSAGE, payload);
  }

  @SubscribeMessage(RealtimeEvents.CHAT_TYPING)
  handleChatTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string; isTyping: boolean },
  ) {
    // Broadcast to others in the room (not the sender)
    client.to(chatRoom(data.chatId)).emit(RealtimeEvents.CHAT_TYPING, data);
  }
}
