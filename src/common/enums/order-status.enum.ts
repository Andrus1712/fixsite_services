export enum OrderStatusEnum {
    PENDING = 1,
    ASSIGNED = 2,
    DIAGNOSING = 3,
    IN_REPAIR = 4,
    COMPLETED = 5,
    DELIVERED = 6,
    CANCELLED = 7,
    WAITING_PARTS = 8,
}

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.PENDING]: 'pending',
    [OrderStatusEnum.ASSIGNED]: 'assigned',
    [OrderStatusEnum.DIAGNOSING]: 'diagnosing',
    [OrderStatusEnum.IN_REPAIR]: 'in_repair',
    [OrderStatusEnum.COMPLETED]: 'completed',
    [OrderStatusEnum.DELIVERED]: 'delivered',
    [OrderStatusEnum.CANCELLED]: 'cancelled',
    [OrderStatusEnum.WAITING_PARTS]: 'waiting_parts',
};

export const ORDER_STATUS_LABELS: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.PENDING]: 'Pendiente',
    [OrderStatusEnum.ASSIGNED]: 'Asignada',
    [OrderStatusEnum.DIAGNOSING]: 'En diagnóstico',
    [OrderStatusEnum.IN_REPAIR]: 'En reparación',
    [OrderStatusEnum.COMPLETED]: 'Completada',
    [OrderStatusEnum.DELIVERED]: 'Entregada',
    [OrderStatusEnum.CANCELLED]: 'Cancelada',
    [OrderStatusEnum.WAITING_PARTS]: 'Esperando repuestos',
};

/**
 * Transiciones válidas entre estados.
 * Clave: estado actual → Valor: estados a los que puede transicionar.
 */
export const VALID_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
    [OrderStatusEnum.PENDING]: [OrderStatusEnum.ASSIGNED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.ASSIGNED]: [OrderStatusEnum.DIAGNOSING, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.DIAGNOSING]: [OrderStatusEnum.IN_REPAIR, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.IN_REPAIR]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.WAITING_PARTS, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.COMPLETED]: [OrderStatusEnum.DELIVERED],
    [OrderStatusEnum.DELIVERED]: [],
    [OrderStatusEnum.CANCELLED]: [],
    [OrderStatusEnum.WAITING_PARTS]: [OrderStatusEnum.IN_REPAIR, OrderStatusEnum.CANCELLED],
};
