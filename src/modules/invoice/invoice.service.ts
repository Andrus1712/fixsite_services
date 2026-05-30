import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Tenant } from 'src/entities/global/tenant.entity';
import { Order } from 'src/entities/branch/order.entity';
import { OrderService } from 'src/entities/branch/order-service.entity';
import { MaterialIssueItem } from 'src/entities/branch/material-issue-items.entity';
import { OrderStatusEnum } from 'src/common/enums';

export interface InvoiceData {
    business: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logo_url: string | null;
        tax_id: string | null;
    };
    invoice: {
        number: string;
        date: string;
        order_code: string;
        received_date: string;
        delivered_date: string | null;
    };
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    device: {
        name: string;
        brand: string | null;
        model: string | null;
        serial_number: string;
        imei: string | null;
    } | null;
    services: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
    }>;
    parts: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total: number;
    }>;
    totals: {
        subtotal_services: number;
        subtotal_parts: number;
        subtotal: number;
        tax_rate: number;
        tax_amount: number;
        discount: number;
        total: number;
        currency: string;
    };
    technician: {
        name: string;
    } | null;
    notes: string | null;
}

@Injectable()
export class InvoiceService {
    constructor(
        private readonly tenantService: ConnectionDatabaseService,
    ) { }

    async getOrderInvoice(tenant: Tenant, orderCode: string): Promise<InvoiceData> {
        const connection = await this.tenantService.getConnection(tenant);

        // 1. Obtener orden completa
        const order = await connection.getRepository(Order)
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.devices', 'devices')
            .leftJoinAndSelect('devices.deviceModel', 'deviceModel')
            .leftJoinAndSelect('deviceModel.deviceBrand', 'deviceBrand')
            .leftJoinAndSelect('order.technician', 'technician')
            .where('order.order_code = :orderCode', { orderCode })
            .getOne();

        if (!order) {
            throw new NotFoundException('Orden no encontrada');
        }

        // Validar que la orden esté en estado COMPLETED o DELIVERED
        if (order.status !== OrderStatusEnum.COMPLETED && order.status !== OrderStatusEnum.DELIVERED) {
            throw new BadRequestException(
                'Solo se puede generar factura para órdenes completadas o entregadas',
            );
        }

        // 2. Obtener servicios aplicados a la orden
        const orderServices = await connection.getRepository(OrderService)
            .createQueryBuilder('os')
            .leftJoinAndSelect('os.service', 'service')
            .where('os.order_id = :orderId', { orderId: order.id })
            .getMany();

        // 3. Obtener repuestos usados (material issue items vinculados a la orden)
        const materialIssueItems = await connection.getRepository(MaterialIssueItem)
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.article', 'article')
            .leftJoinAndSelect('item.materialIssue', 'materialIssue')
            .where('item.destinationReference = :orderId', { orderId: order.id })
            .andWhere('materialIssue.status = :status', { status: 'APPROVED' })
            .getMany();

        // 4. Generar número de factura
        const invoiceNumber = await this.generateInvoiceNumber(connection);

        // 5. Construir respuesta
        const device = order.devices?.[0] || null;

        const services = orderServices.map(os => ({
            description: os.service?.description || 'Servicio',
            quantity: 1,
            unit_price: Number(os.price) || 0,
            total: Number(os.price) || 0,
        }));

        const parts = materialIssueItems.map(item => ({
            description: item.article?.name || 'Repuesto',
            quantity: item.quantity,
            unit_price: 0, // El precio unitario del artículo no está en la entidad actual
            total: 0,
        }));

        const subtotalServices = services.reduce((sum, s) => sum + s.total, 0);
        const subtotalParts = parts.reduce((sum, p) => sum + p.total, 0);
        const subtotal = subtotalServices + subtotalParts;
        const taxRate = 0; // Configurar según país/tenant
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        return {
            business: {
                name: tenant.name,
                address: '',
                phone: '',
                email: '',
                logo_url: null,
                tax_id: null,
            },
            invoice: {
                number: invoiceNumber,
                date: new Date().toISOString().split('T')[0],
                order_code: order.order_code,
                received_date: order.createdAt instanceof Date
                    ? order.createdAt.toISOString().split('T')[0]
                    : String(order.createdAt).split('T')[0],
                delivered_date: order.actual_completion
                    ? (order.actual_completion instanceof Date
                        ? order.actual_completion.toISOString().split('T')[0]
                        : String(order.actual_completion))
                    : null,
            },
            customer: {
                name: order.customer?.customer_name || '',
                email: order.customer?.customer_email || '',
                phone: order.customer?.customer_phone || '',
                address: order.customer?.customer_address || '',
            },
            device: device ? {
                name: device.device_name,
                brand: device.deviceModel?.deviceBrand?.name || null,
                model: device.deviceModel?.name || null,
                serial_number: device.serial_number,
                imei: device.imei || null,
            } : null,
            services,
            parts,
            totals: {
                subtotal_services: subtotalServices,
                subtotal_parts: subtotalParts,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                discount: 0,
                total,
                currency: order.currency || 'USD',
            },
            technician: order.technician ? { name: order.technician.name } : null,
            notes: null,
        };
    }

    private async generateInvoiceNumber(connection: any): Promise<string> {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `FAC-${datePart}-`;

        // Buscar la última factura del día para generar secuencial
        // Como no tenemos tabla de facturas, usamos un contador simple basado en timestamp
        const timestamp = Date.now().toString().slice(-5);
        return `${prefix}${timestamp}`;
    }
}
