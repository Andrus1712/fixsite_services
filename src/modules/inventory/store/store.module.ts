import { Module } from "@nestjs/common";
import { StoreController } from "./store.controller";
import { StoreService } from "./store.service";
import { MaterialReceiptService } from "../material-receipt/material-receipt.service";
import { InventoryAdjustmentService } from "../inventory-adjustment/inventory-adjustment.service";
import { StockTransferService } from "../stock-transfer/stock-transfer.service";
import { MaterialIssueService } from "../material-issue/material-issue.service";
import { InventoryService } from "../inventory-core/inventory.service";

@Module({
    imports: [],
    controllers: [StoreController],
    providers: [
        StoreService,
        InventoryService,
        MaterialReceiptService,
        MaterialIssueService,
        InventoryAdjustmentService,
        StockTransferService
    ],
    exports: [StoreService],
})
export class StoreModule { }
