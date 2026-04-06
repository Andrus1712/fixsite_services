import { Injectable } from '@nestjs/common';
import { ConnectionDatabaseService } from 'src/database/connection-database.service';
import { Inventory } from 'src/entities/branch/inventory.entity';
import { MaterialIssue, MaterialIssueStatus } from 'src/entities/branch/material-issues.entity';
import { MaterialReceipt, MaterialReceiptStatus } from 'src/entities/branch/material-receipts.entity';
import { StockTransfer, StockTransferStatus } from 'src/entities/branch/stock-transfer.entity';
import { InventoryAdjustment, InventoryAdjustmentStatus } from 'src/entities/branch/inventory-adjustment.entity';
import { Tenant } from 'src/entities/global/tenant.entity';
import { InventoryStats, PendingRequests, StoreInventoryStats } from '../../realtime/realtime.types';

type StoreCount = { storeId: number; cnt: string };

@Injectable()
export class StatsService {
  constructor(private readonly connectionService: ConnectionDatabaseService) {}

  async getInventoryStats(tenant: Tenant): Promise<InventoryStats> {
    const [inventoryRepo, issueRepo, receiptRepo, transferRepo, adjustmentRepo] =
      await Promise.all([
        this.connectionService.getRepository(Inventory, tenant),
        this.connectionService.getRepository(MaterialIssue, tenant),
        this.connectionService.getRepository(MaterialReceipt, tenant),
        this.connectionService.getRepository(StockTransfer, tenant),
        this.connectionService.getRepository(InventoryAdjustment, tenant),
      ]);

    const PENDING = MaterialReceiptStatus.PENDING;

    const [
      totalItems, stockResult, lowStockItems, byStoreRaw,
      pendingReceipts, pendingIssues, pendingTransfers, pendingAdjustments,
      // today globals
      todayReceipts, todayIssues, todayTransfers, todayAdjustments,
      // pending by store
      receiptsByStore, issuesByStore, transfersByStore, adjustmentsByStore,
      // today pending by store
      todayReceiptsByStore, todayIssuesByStore, todayTransfersByStore, todayAdjustmentsByStore,
    ] = await Promise.all([
      inventoryRepo.count(),
      inventoryRepo.createQueryBuilder('inv').select('SUM(inv.stock)', 'total').getRawOne(),
      inventoryRepo.createQueryBuilder('inv').where('inv.stock <= inv.min_stock').getCount(),
      inventoryRepo.createQueryBuilder('inv')
        .innerJoin('inv.store', 'store')
        .select([
          'store.id          AS "storeId"',
          'store.name        AS "storeName"',
          'store.type        AS "storeType"',
          'COUNT(inv.id)     AS "totalItems"',
          'SUM(inv.stock)    AS "totalStock"',
          'SUM(CASE WHEN inv.stock <= inv.min_stock THEN 1 ELSE 0 END) AS "lowStockItems"',
        ])
        .groupBy('store.id, store.name, store.type')
        .getRawMany(),

      // global pending totals
      receiptRepo.count({ where: { status: PENDING } }),
      issueRepo.count({ where: { status: MaterialIssueStatus.PENDING } }),
      transferRepo.count({ where: { status: StockTransferStatus.PENDING } }),
      adjustmentRepo.count({ where: { status: InventoryAdjustmentStatus.PENDING } }),

      // today pending totals
      receiptRepo.createQueryBuilder('r')
        .where('r.status = :s AND r."createdAt"::date = CURRENT_DATE', { s: PENDING }).getCount(),
      issueRepo.createQueryBuilder('i')
        .where('i.status = :s AND i."createdAt"::date = CURRENT_DATE', { s: MaterialIssueStatus.PENDING }).getCount(),
      transferRepo.createQueryBuilder('t')
        .where('t.status = :s AND t."createdAt"::date = CURRENT_DATE', { s: StockTransferStatus.PENDING }).getCount(),
      adjustmentRepo.createQueryBuilder('a')
        .where('a.status = :s AND a."createdAt"::date = CURRENT_DATE', { s: InventoryAdjustmentStatus.PENDING }).getCount(),

      // pending by store
      receiptRepo.createQueryBuilder('r')
        .innerJoin('r.store', 's').select(['s.id AS storeId', 'COUNT(r.id) AS cnt'])
        .where('r.status = :s', { s: PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
      issueRepo.createQueryBuilder('i')
        .innerJoin('i.store', 's').select(['s.id AS storeId', 'COUNT(i.id) AS cnt'])
        .where('i.status = :s', { s: MaterialIssueStatus.PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
      transferRepo.createQueryBuilder('t')
        .innerJoin('t.fromStore', 's').select(['s.id AS storeId', 'COUNT(t.id) AS cnt'])
        .where('t.status = :s', { s: StockTransferStatus.PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
      adjustmentRepo.createQueryBuilder('a')
        .innerJoin('a.store', 's').select(['s.id AS storeId', 'COUNT(a.id) AS cnt'])
        .where('a.status = :s', { s: InventoryAdjustmentStatus.PENDING }).groupBy('s.id').getRawMany<StoreCount>(),

      // today pending by store
      receiptRepo.createQueryBuilder('r')
        .innerJoin('r.store', 's').select(['s.id AS storeId', 'COUNT(r.id) AS cnt'])
        .where('r.status = :s AND r."createdAt"::date = CURRENT_DATE', { s: PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
      issueRepo.createQueryBuilder('i')
        .innerJoin('i.store', 's').select(['s.id AS storeId', 'COUNT(i.id) AS cnt'])
        .where('i.status = :s AND i."createdAt"::date = CURRENT_DATE', { s: MaterialIssueStatus.PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
      transferRepo.createQueryBuilder('t')
        .innerJoin('t.fromStore', 's').select(['s.id AS storeId', 'COUNT(t.id) AS cnt'])
        .where('t.status = :s AND t."createdAt"::date = CURRENT_DATE', { s: StockTransferStatus.PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
      adjustmentRepo.createQueryBuilder('a')
        .innerJoin('a.store', 's').select(['s.id AS storeId', 'COUNT(a.id) AS cnt'])
        .where('a.status = :s AND a."createdAt"::date = CURRENT_DATE', { s: InventoryAdjustmentStatus.PENDING }).groupBy('s.id').getRawMany<StoreCount>(),
    ]);

    const toMap = (rows: StoreCount[]) => new Map(rows.map(r => [Number(r.storeId), Number(r.cnt)]));
    const receiptMap        = toMap(receiptsByStore);
    const issueMap          = toMap(issuesByStore);
    const transferMap       = toMap(transfersByStore);
    const adjustmentMap     = toMap(adjustmentsByStore);
    const todayReceiptMap   = toMap(todayReceiptsByStore);
    const todayIssueMap     = toMap(todayIssuesByStore);
    const todayTransferMap  = toMap(todayTransfersByStore);
    const todayAdjMap       = toMap(todayAdjustmentsByStore);

    const buildPending = (mr: number, mi: number, st: number, ia: number): PendingRequests =>
      ({ materialReceipts: mr, materialIssues: mi, stockTransfers: st, inventoryAdjustments: ia, total: mr + mi + st + ia });

    const byStore: StoreInventoryStats[] = byStoreRaw.map(r => {
      const sid = Number(r.storeId);
      const mr  = receiptMap.get(sid)    ?? 0;
      const mi  = issueMap.get(sid)      ?? 0;
      const st  = transferMap.get(sid)   ?? 0;
      const ia  = adjustmentMap.get(sid) ?? 0;
      const tmr = todayReceiptMap.get(sid)  ?? 0;
      const tmi = todayIssueMap.get(sid)    ?? 0;
      const tst = todayTransferMap.get(sid) ?? 0;
      const tia = todayAdjMap.get(sid)      ?? 0;
      return {
        storeId:       sid,
        storeName:     r.storeName,
        storeType:     r.storeType,
        totalItems:    Number(r.totalItems),
        totalStock:    Number(r.totalStock),
        lowStockItems: Number(r.lowStockItems),
        pendingRequests:      buildPending(mr, mi, st, ia),
        todayPendingRequests: buildPending(tmr, tmi, tst, tia),
      };
    });

    return {
      totalItems,
      totalStock:           Number(stockResult?.total ?? 0),
      lowStockItems,
      byStore,
      pendingRequests:      buildPending(pendingReceipts, pendingIssues, pendingTransfers, pendingAdjustments),
      todayPendingRequests: buildPending(todayReceipts, todayIssues, todayTransfers, todayAdjustments),
    };
  }
}
