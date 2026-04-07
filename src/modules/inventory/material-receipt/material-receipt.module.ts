import { Module } from "@nestjs/common";
import { MaterialReceiptController } from "./material-receipt.controller";
import { MaterialReceiptService } from "./material-receipt.service";
import { InventoryCoreModule } from "../inventory-core/inventory-core.module";
import { RealtimeModule } from "src/modules/realtime/realtime.module";

@Module({
    imports: [InventoryCoreModule, RealtimeModule],
    controllers: [MaterialReceiptController],
    providers: [MaterialReceiptService],
    exports: [MaterialReceiptService],
})
export class MaterialReceiptModule { }
