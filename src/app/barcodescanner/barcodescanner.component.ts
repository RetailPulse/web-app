import { AfterViewInit, ViewChild, Component } from '@angular/core';
import { NgxScannerQRCodeAdapterComponent } from '../ngx-scannerqrcode-adapter/ngx-scannerqrcode-adapter.component';

@Component({
  selector: 'app-barcodescanner',
  imports: [NgxScannerQRCodeAdapterComponent],
  templateUrl: './barcodescanner.component.html',
  styleUrls: ['./barcodescanner.component.css']
})
export class BarcodescannerComponent implements AfterViewInit {
  @ViewChild('scanner') scanner!: NgxScannerQRCodeAdapterComponent;

  ngAfterViewInit(): void {
    console.log('Casper: Init Scanner');

    if (!this.scanner) {
      console.error('Casper: Scanner not found!');
      return;
    }

    // Start the scanner
    this.scanner.startScanner();
  }

  ngOnDestroy(): void {
    console.log('Casper: Destroy Scanner');

    if (this.scanner) {
      // Stop the scanner
      this.scanner.stopScanner();
    }
  }

  onCodeResult(resultString: string): void {
    alert(`Barcode scanned: ${resultString}`);
  }
}