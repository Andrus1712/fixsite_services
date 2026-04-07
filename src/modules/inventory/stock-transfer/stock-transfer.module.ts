import { Module } from "@nestjs/common";
import { StockTransferController } from "./stock-transfer.controller";
import { StockTransferService } from "./stock-transfer.service";
import { InventoryCoreModule } from "../inventory-core/inventory-core.module";

@Module({
    imports: [InventoryCoreModule],
    controllers: [StockTransferController],
    providers: [StockTransferService],
    exports: [StockTransferService],
})
export class StockTransferModule { }
