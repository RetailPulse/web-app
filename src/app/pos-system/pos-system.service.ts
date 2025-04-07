import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {apiConfig} from '../../environments/environment';
import {SalesDetails, Transaction} from './pos-system.model';
import {TransactionAdapter} from './transaction-adapter';


@Injectable({
  providedIn: 'root'
})
export class PosSystemService {
  private apiUrl = apiConfig.backend_api_url + 'api/sales'; // Replace with your API URL

  constructor(private http: HttpClient) { }

  calculateSalesTax(transaction: Transaction): Observable<number>
  {
    const salesDetails:SalesDetails[] =  TransactionAdapter.mapTransactionToSalesDetails(transaction);
    console.log(salesDetails);
    return this.http.post<number>(`${this.apiUrl}/calculateSalesTax`, salesDetails);
  }





}
