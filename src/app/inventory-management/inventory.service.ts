import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {apiConfig} from '../../environments/environment';
import { InventoryTransaction} from '../inventory-modal/inventory-modal.model';
import {Inventory} from './inventory.model';


@Injectable({
  providedIn: 'root'
})


export class InventoryService {

  private inventoryTransactionApiUrl = `${apiConfig.backend_api_url}api/inventoryTransaction`;
  private inventoryApiUrl = `${apiConfig.backend_api_url}api/inventory`;


  constructor(private http: HttpClient) { }

  getInventoryTransaction(): Observable<InventoryTransaction[]> {
    return this.http.get<InventoryTransaction[]>(this.inventoryTransactionApiUrl);
  }
  getInventoryByBusinessEntity(businessEntityId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.inventoryApiUrl}/businessEntityId/${businessEntityId}`);
  }

}
