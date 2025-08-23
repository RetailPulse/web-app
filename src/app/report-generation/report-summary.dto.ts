export interface ReportSummaryDto {
  id: string;
  reportType: string;
  fileName: string;
  startDateTime: string; // ISO string from backend (Instant)
  endDateTime: string;   // ISO string from backend (Instant)
  createdAt: string;     // ISO string from backend (Instant)
}
