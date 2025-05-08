import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from './product.model';
import { apiConfig } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http: HttpClient = inject(HttpClient);
  private apiUrl = apiConfig.backend_api_url + 'api/products';

  constructor() { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[] | null>(this.apiUrl).pipe(
      map(response => response || []),
      catchError(this.handleError<Product[]>('getProducts', []))
    );
  }

  createProduct(newProduct: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, newProduct).pipe(
      catchError(this.handleError<Product>('createProduct'))
    );
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}`).pipe(
      catchError(this.handleError<void>('deleteProduct'))
    );
  }

  reverseProduct(productId: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/reverseSoftDelete/${productId}`, null).pipe(
      catchError(this.handleError<Product>('reverseProduct'))
    );
  }

  updateProduct(updatedProduct: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${updatedProduct.id}`, updatedProduct).pipe(
      catchError(this.handleError<Product>('updateProduct'))
    );
  }

  getProductById(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${productId}`).pipe(
      catchError(this.handleError<Product>('getProductById'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(error);

      if (error.status === 0) {
        return throwError(() => new Error(`Network error: ${operation} failed: ${error.message}`));
      }
      if (error.status === 404) {
        return throwError(() => new Error(`Not found: ${operation} failed: ${error.message}`));
      }
      // For other errors, re-throw the original error
      return throwError(() => error);
    };
  }
}
