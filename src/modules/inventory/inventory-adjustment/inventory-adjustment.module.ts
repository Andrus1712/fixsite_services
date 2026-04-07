import { Module } from "@nestjs/common";
import { InventoryAdjustmentController } from "./inventory-adjustment.controller";
import { InventoryAdjustmentService } from "./inventory-adjustment.service";
import { InventoryCoreModule } from "../inventory-core/inventory-core.module";

@Module({
    imports: [InventoryCoreModule],
    controllers: [InventoryAdjustmentController],
    providers: [InventoryAdjustmentService],
    exports: [InventoryAdjustmentService],
})
export class InventoryAdjustmentModule { }
