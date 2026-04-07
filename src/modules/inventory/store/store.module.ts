import { Module } from "@nestjs/common";
import { StoreController } from "./store.controller";
import { StoreService } from "./store.service";
import { InventoryCoreModule } from "../inventory-core/inventory-core.module";
import { MaterialReceiptModule } from "../material-receipt/material-receipt.module";
import { MaterialIssueModule } from "../material-issue/material-issue.module";
import { InventoryAdjustmentModule } from "../inventory-adjustment/inventory-adjustment.module";
import { StockTransferModule } from "../stock-transfer/stock-transfer.module";
import { StatsService } from "./stats.service";

@Module({
    imports: [
        InventoryCoreModule,
        MaterialReceiptModule,
        MaterialIssueModule,
        InventoryAdjustmentModule,
        StockTransferModule,
    ],
    controllers: [StoreController],
    providers: [StoreService, StatsService],
    exports: [StoreService, StatsService],
})
export class StoreModule { }
