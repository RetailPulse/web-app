import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportSummaryDto } from './report-summary.dto';
import {apiConfig} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private baseUrl = apiConfig.report_api_url + 'api/reports';

  constructor(private http: HttpClient) {}

  listSummaries(): Observable<ReportSummaryDto[]> {
    return this.http.get<ReportSummaryDto[]>(`${this.baseUrl}`);
    // Adjust path if your list endpoint differs
  }

  downloadContent(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${id}/content`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
}
