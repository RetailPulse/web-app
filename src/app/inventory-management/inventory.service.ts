import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryTransaction } from '../inventory-modal/inventory-modal.model';
import { Inventory } from './inventory.model';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http: HttpClient = inject(HttpClient);
  private config: ConfigService = inject(ConfigService);

  private inventoryTransactionApiUrl = `${this.config.apiConfig.inventory_api_url}api/inventoryTransaction`;
  private inventoryApiUrl = `${this.config.apiConfig.inventory_api_url}api/inventory`;

  constructor() {}

  getInventoryTransaction(): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(this.inventoryTransactionApiUrl);
  }

  getInventoryByBusinessEntity(businessEntityId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.inventoryApiUrl}/businessEntityId/${businessEntityId}`);
  }
}