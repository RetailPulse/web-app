import {
  SalesDetails,
  SalesTransactionRequest,
  SalesTransactionResponse, SuspendedTransactionRequest, TaxResult,
  Transaction,
  TransientTransaction
} from './pos-system.model';
import {TransactionAdapter} from './transaction-adapter';
import {apiConfig} from '../../environments/environment';

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PosSystemService {
  private apiUrl = apiConfig.sales_api_url + 'api/sales'; // Replace with your API URL

  constructor(private http: HttpClient) {
  }

  calculateSalesTax(transaction: Transaction) {
   
    const salesDetails: SalesDetails[] = TransactionAdapter.mapTransactionToSalesDetails(transaction);
    console.log(salesDetails);

    return this.http.post<TaxResult>(
      `${this.apiUrl}/calculateSalesTax`, salesDetails)
      .pipe(
        catchError(error => {
          console.error('Error calculating sales tax:', error);
          return throwError(() => new Error('Failed to calculate sales tax.'));
        })
      );
  }

  createTransaction(salesTransaction: SalesTransactionRequest) {
    return this.http.post<SalesTransactionResponse>(`${this.apiUrl}/createTransaction`, salesTransaction)
      .pipe(
        catchError(error => {
          console.error('Error creating transaction:', error);
          return throwError(() => new Error('Failed to create transaction.'));
        })
      );
  }


  suspendTransaction(suspendedTransaction: SuspendedTransactionRequest) {
    return this.http.post<TransientTransaction[]>(`${this.apiUrl}/suspend`, suspendedTransaction)
      .pipe(
        catchError(
          error => {
            console.error('Error suspending transaction:', error);
            return throwError(() => new Error('Failed to suspend transaction.'));
          }
        )
      );
  }

  resumeTransaction(businessEntityId: number, transactionId: string) {
    return this.http.delete<TransientTransaction[]>(`${this.apiUrl}/${businessEntityId}/suspended-transactions/${transactionId}`)
      .pipe(
        catchError(error => {
          console.error('Error resuming transaction:', error);
          return throwError(() => new Error('Failed to resume transaction.'));
        })
      );
  }

}
