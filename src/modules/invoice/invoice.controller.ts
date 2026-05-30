import { Controller, Get, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { TenantSelectionGuard } from '../auth/guards/tenant-selection.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../entities/global/tenant.entity';

@Controller('invoices')
@UseGuards(TenantSelectionGuard)
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) { }

    @Get('/order/:order_code')
    async getOrderInvoice(
        @CurrentTenant() tenant: Tenant,
        @Param('order_code') orderCode: string,
    ) {
        const data = await this.invoiceService.getOrderInvoice(tenant, orderCode);
        return {
            success: true,
            status: HttpStatus.OK,
            message: 'Factura generada correctamente',
            data,
            errors: null,
        };
    }
}
