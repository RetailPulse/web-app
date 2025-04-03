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
export class NgxScannerqrcodeAdapterComponent extends InputScanner implements AfterViewInit {
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth
      },
    },
  };

  public qrCodeResult: ScannerQRCodeSelectedFiles[] = [];
  private qrcode: NgxScannerQrcodeService;

  @ViewChild('action') action!: NgxScannerQrcodeComponent;
  @Output() scannedEvent = new EventEmitter<string>();

  constructor() { 
    super(); 
    this.qrcode = new NgxScannerQrcodeService();
  } 

  ngAfterViewInit(): void {
    this.action.isReady.subscribe((res: any) => {
      // this.handle(this.action, 'start');
    });
  }

  StartScanner() {
    console.log('Start Scanner');
    this.handle(this.action, 'start');
  }

  StopScanner() {
    this.handle(this.action, 'stop');
  }

  public onEvent(e: ScannerQRCodeResult[], action?: any): void {
    // e && action && action.pause();    
    console.log(e[0].data);
    const decodedData = new TextDecoder().decode(e[0].data);
    this.scannedEvent.emit(decodedData); // Emit the scanned data
  }

  public handle(action: any, fn: string): void {
    // Fix issue #27, #29
    const playDeviceFacingBack = (devices: any[]) => {
      // front camera or back camera check here!
      const device = devices.find(f => (/back|rear|environment/gi.test(f.label))); // Default Back Facing Camera
      action.playDevice(device ? device.deviceId : devices[0].deviceId);
    }
    
    console.log('Function:', fn);

    if (fn === 'start') {
      action[fn](playDeviceFacingBack).subscribe((r: any) => console.log(fn, r), alert);
    } else {
      action[fn]().subscribe((r: any) => console.log(fn, r), alert);
    }
  }

}
