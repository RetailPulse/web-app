import { AfterViewInit, ViewChild, Component } from '@angular/core';
import { NgxScannerqrcodeAdapterComponent } from '../ngx-scannerqrcode-adapter/ngx-scannerqrcode-adapter.component';

@Component({
  selector: 'app-barcodescanner',
  imports: [NgxScannerqrcodeAdapterComponent],
  templateUrl: './barcodescanner.component.html',
  styleUrls: ['./barcodescanner.component.css']
})
export class BarcodescannerComponent implements AfterViewInit {
  @ViewChild('scanner') scanner!: NgxScannerqrcodeAdapterComponent;

  ngAfterViewInit(): void {
    console.log('Casper: Init Scanner');

    if (!this.scanner) {
      console.error('Casper: Scanner not found!');
      return;
    }

    // Start the scanner
    this.scanner.StartScanner();
  }

  ngOnDestroy(): void {
    console.log('Casper: Destroy Scanner');

    if (this.scanner) {
      // Stop the scanner
      this.scanner.StopScanner();
    }
  }

  onCodeResult(resultString: string): void {
    alert(`Barcode scanned: ${resultString}`);
  }
}