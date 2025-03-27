import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {catchError, forkJoin, map, Observable, throwError} from 'rxjs';
import {apiConfig} from '../../environments/environment';
import {Inventory, InventoryTransaction} from "./inventory-modal.model";


@Injectable({
  providedIn: 'root'
})


export class InventoryModalService {

  private inventoryTransactionApiUrl = `${apiConfig.backend_api_url}api/inventoryTransaction`;
  private inventoryApiUrl = `${apiConfig.backend_api_url}api/inventory`;

  constructor(private http: HttpClient) { }

  createInventoryTransaction(inventoryTransactionList: InventoryTransaction[]): Observable<string> {
    const requests: Observable<HttpResponse<InventoryTransaction>>[] = inventoryTransactionList.map(inventoryTransaction =>
      this.http.post<InventoryTransaction>(this.inventoryTransactionApiUrl, inventoryTransaction, { observe: 'response' })
    );

    return forkJoin(requests).pipe(
      map(responses => {
        const allSuccessful = responses.every(response => response.status === 200);
        if (allSuccessful) {
          return 'All transactions were successfully inserted.';
        } else {
          throw new Error('Some transactions failed to insert.');
        }
      }),
      catchError(error => {
        return throwError(() => new Error(`Error: ${error.message}`));
      })
    );
  }


}
