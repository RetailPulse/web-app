import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { BusinessEntity, BusinessEntityDTO } from './business-entity.model';
import { apiConfig } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessEntityService {

  private http: HttpClient = inject(HttpClient);
  private apiUrl = apiConfig.backend_api_url + 'api/businessEntity';

  constructor() { }

  getBusinessEntities(): Observable<BusinessEntity[]> {
    return this.http.get<BusinessEntity[]>(this.apiUrl).pipe(
      catchError((err) => {
        throw new Error(err.error.message);
      })
    );
  }

  createBusinessEntity(newBusinessEntity: BusinessEntity): Observable<BusinessEntity> {
    const businessEntity_dto: BusinessEntityDTO = {
      name: newBusinessEntity.name,
      location: newBusinessEntity.location,
      type: newBusinessEntity.type,
      external: newBusinessEntity.external,
    };

    return this.http.post<BusinessEntity>(this.apiUrl, businessEntity_dto).pipe(
      catchError((err) => {
        throw new Error(err.error.message);
      })
    );
  }

  editUser(currBusinessEntity: BusinessEntity): Observable<BusinessEntity> {
    const businessEntity_dto: BusinessEntityDTO = {
      name: currBusinessEntity.name,
      location: currBusinessEntity.location,
      type: currBusinessEntity.type,
      external: currBusinessEntity.external,
    };

    return this.http.put<BusinessEntity>(`${this.apiUrl}/${currBusinessEntity.id}`, businessEntity_dto).pipe(
      catchError((err) => {
        throw new Error(err.error.message);
      })
    );
  }

  deleteBusinessEntity(businessEntityId:number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${businessEntityId}`).pipe(
      catchError((err) => {
        throw new Error(err.error.message);
      })
    );
  }

  getBusinessEntityById(businessEntityId:number): Observable<BusinessEntity> {
    return this.http.get<BusinessEntity>(`${this.apiUrl}/${businessEntityId}`).pipe(
      catchError((err) => {
        throw new Error(err.error.message);
      })
    );
  }
}
