import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportSummaryDto } from './report-summary.dto';
import { ConfigService } from '../services/config.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly config: ConfigService = inject(ConfigService);
  private readonly baseUrl = this.config.apiConfig.report_api_url + 'api/reports';

  listSummaries(): Observable<ReportSummaryDto[]> {
    return this.http.get<ReportSummaryDto[]>(this.baseUrl);
  }

  downloadContent(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${id}/content`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
}