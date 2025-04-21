import { ScannerQRCodeConfig, NgxScannerQrcodeService, ScannerQRCodeSelectedFiles, ScannerQRCodeResult, NgxScannerQrcodeComponent, ScannerQRCodeSymbolType } from 'ngx-scanner-qrcode';

import { InputScanner } from '../input-scanner/input-scanner.component';
import { AfterViewInit, ViewChild, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngx-scannerqrcode-adapter',
  imports: [
    NgxScannerQrcodeComponent, 
    CommonModule
  ],
  templateUrl: './ngx-scannerqrcode-adapter.component.html',
  styleUrl: './ngx-scannerqrcode-adapter.component.css'
})
export class NgxScannerQRCodeAdapterComponent extends InputScanner implements AfterViewInit {
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth
      },
    },
  };

  public scannedResults: ScannerQRCodeSelectedFiles[] = [];
  private scanCodeService: NgxScannerQrcodeService;

  @ViewChild('action') codeScanner!: NgxScannerQrcodeComponent;
  @Output() scannedEvent = new EventEmitter<string>();

  constructor() { 
    super(); 
    this.scanCodeService= new NgxScannerQrcodeService();
  } 

  ngAfterViewInit(): void {
    this.codeScanner.isReady.subscribe((res: any) => {
      // this.handle(this.codeScanner, 'start');
    });
  }

  startScanner() {
    console.log('Start Scanner');
    this.handle(this.codeScanner, 'start');
  }

  stopScanner() {
    this.handle(this.codeScanner, 'stop');
  }

  public onEvent(e: ScannerQRCodeResult[], codeScanner?: any): void {
    // e && codeScanner && codeScanner.pause();    
    console.log(e[0].data);
    const decodedData = new TextDecoder().decode(e[0].data);
    this.scannedEvent.emit(decodedData); // Emit the scanned data
  }

  public handle(codeScanner: any, fn: string): void {
    // Fix issue #27, #29
    const playDeviceFacingBack = (devices: any[]) => {
      // front camera or back camera check here!
      const device = devices.find(f => (/back|rear|environment/gi.test(f.label))); // Default Back Facing Camera
      codeScanner.playDevice(device ? device.deviceId : devices[0].deviceId);
    }
    
    console.log('Function:', fn);

    if (fn === 'start') {
      codeScanner[fn](playDeviceFacingBack).subscribe((r: any) => console.log(fn, r), alert);
    } else {
      codeScanner[fn]().subscribe((r: any) => console.log(fn, r), alert);
    }
  }
}
