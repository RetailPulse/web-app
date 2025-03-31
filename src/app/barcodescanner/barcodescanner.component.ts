import { AfterViewInit, ViewChild, Component } from '@angular/core';

import { ScannerQRCodeConfig, NgxScannerQrcodeService, ScannerQRCodeSelectedFiles, ScannerQRCodeResult, NgxScannerQrcodeComponent, ScannerQRCodeSymbolType } from 'ngx-scanner-qrcode';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-barcodescanner',
  imports: [
    NgxScannerQrcodeComponent, 
    CommonModule
  ],
  templateUrl: './barcodescanner.component.html',
  styleUrl: './barcodescanner.component.css'
})
export class BarcodescannerComponent implements AfterViewInit {

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#front_and_back_camera
    public config: ScannerQRCodeConfig = {
      constraints: {
        video: {
          width: window.innerWidth
        },
      },
      // symbolType: [
      //   ScannerQRCodeSymbolType.ScannerQRCode_QRCODE,
      //   ScannerQRCodeSymbolType.ScannerQRCode_I25,
      //   ScannerQRCodeSymbolType.ScannerQRCode_DATABAR,
      //   ScannerQRCodeSymbolType.ScannerQRCode_CODE39,
      // ],
      // isMasked: false,
      // unScan: true,
      // canvasStyles: [
      //   {
      //     lineWidth: 1,
      //     fillStyle: '#00950685',
      //     strokeStyle: '#00950685',
      //   },
      //   {
      //     font: '17px serif',
      //     fillStyle: '#ff0000',
      //     strokeStyle: '#ff0000',
      //   }
      // ],
    };

    public qrCodeResult: ScannerQRCodeSelectedFiles[] = [];
    public qrCodeResult2: ScannerQRCodeSelectedFiles[] = [];
    public percentage = 80;
    public quality = 100;
  
    @ViewChild('action') action!: NgxScannerQrcodeComponent;
  
    constructor(private qrcode: NgxScannerQrcodeService) { } 

    ngAfterViewInit(): void {
      this.action.isReady.subscribe((res: any) => {
        this.handle(this.action, 'start');
      });
    }
    
    public onEvent(e: ScannerQRCodeResult[], action?: any): void {
      // e && action && action.pause();
      console.log("Casper Here 3:", action);
      console.log(e);
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
