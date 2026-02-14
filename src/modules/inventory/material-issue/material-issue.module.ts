import { Module } from "@nestjs/common";
import { MaterialIssueController } from "./material-issue.controller";
import { MaterialIssueService } from "./material-issue.service";
import { InventoryCoreModule } from "../inventory-core/inventory-core.module";

@Module({
    imports: [InventoryCoreModule],
    controllers: [MaterialIssueController],
    providers: [MaterialIssueService],
    exports: [MaterialIssueService],
})
export class MaterialIssueModule { }
