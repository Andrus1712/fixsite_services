// ─── Rooms ────────────────────────────────────────────────────────────────────
export const tenantRoom = (tenantId: string) => `tenant:${tenantId}`;
export const chatRoom   = (chatId: string)   => `chat:${chatId}`;
export const userRoom   = (userId: string)   => `user:${userId}`;

// ─── Event names ──────────────────────────────────────────────────────────────
export const RealtimeEvents = {
  // connection
  JOIN:               'join',
  LEAVE:              'leave',
  CONNECTED:          'connected',
  DISCONNECTED:       'disconnected',

  // stats
  STATS_REQUEST:      'stats:request',
  STATS_UPDATE:       'stats:update',
  STATS_ERROR:        'stats:error',

  // notifications
  NOTIFICATION_NEW:   'notification:new',
  NOTIFICATION_READ:  'notification:read',

  // chat
  CHAT_JOIN:          'chat:join',
  CHAT_LEAVE:         'chat:leave',
  CHAT_MESSAGE:       'chat:message',
  CHAT_TYPING:        'chat:typing',
} as const;

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface JoinPayload {
  tenantId: string;
  userId: string;
}

export interface ChatMessagePayload {
  chatId: string;
  userId: string;
  message: string;
  createdAt?: string;
}

export interface ChatTypingPayload {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface NotificationPayload {
  id: string;
  userId?: string;       // undefined = broadcast to whole tenant
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface PendingRequests {
  materialReceipts: number;
  materialIssues: number;
  stockTransfers: number;
  inventoryAdjustments: number;
  total: number;
}

export interface StoreInventoryStats {
  storeId: number;
  storeName: string;
  storeType: string;
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  pendingRequests: PendingRequests;
  todayPendingRequests: PendingRequests;
}

export interface InventoryStats {
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  byStore: StoreInventoryStats[];
  pendingRequests: PendingRequests;
  todayPendingRequests: PendingRequests;
}
