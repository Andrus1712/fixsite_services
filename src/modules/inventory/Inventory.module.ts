import { Module } from "@nestjs/common";
import { BrandModule } from "./brand/brand.module";
import { CategoryModule } from "./category/category.module";
import { ArticleModule } from "./article/article.module";
import { StoreModule } from "./store/store.module";
import { ProviderModule } from "./provider/provider.module";
import { InventoryAdjustmentModule } from "./inventory-adjustment/inventory-adjustment.module";
import { MaterialReceiptModule } from "./material-receipt/material-receipt.module";
import { MaterialIssueModule } from "./material-issue/material-issue.module";
import { PurchaseOrderModule } from "./purchase-order/purchase-order.module";
import { StockTransferModule } from "./stock-transfer/stock-transfer.module";
@Module({
    imports: [
        // Catalogo
        BrandModule,
        CategoryModule,
        ArticleModule,
        ProviderModule,
        StoreModule,
        // Inventario
        InventoryAdjustmentModule,
        MaterialReceiptModule,
        MaterialIssueModule,
        PurchaseOrderModule,
        StockTransferModule
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class InventoryModule { }