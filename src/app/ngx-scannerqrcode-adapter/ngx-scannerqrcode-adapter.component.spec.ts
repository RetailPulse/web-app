import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgxScannerQRCodeAdapterComponent } from './ngx-scannerqrcode-adapter.component';
import { NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';
import { EventEmitter } from '@angular/core';

describe('NgxScannerQRCodeAdapterComponent', () => {
  let component: NgxScannerQRCodeAdapterComponent;
  let fixture: ComponentFixture<NgxScannerQRCodeAdapterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxScannerQRCodeAdapterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NgxScannerQRCodeAdapterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should instantiate scanCodeService', () => {
    expect(component['scanCodeService']).toBeTruthy();
  });

  it('should emit scannedEvent with decoded data in onEvent', () => {
    const emitSpy = spyOn(component.scannedEvent, 'emit');
    // Simulate Uint8Array data for TextDecoder
    const testString = 'test123';
    const encoder = new TextEncoder();
    const encoded = encoder.encode(testString);
    const event = [{ data: encoded }];
    component.onEvent(event as any, {});
    expect(emitSpy).toHaveBeenCalledWith(testString);
  });

  it('should call handle with "start" in startScanner', () => {
    const handleSpy = spyOn(component, 'handle');
    component.codeScanner = {} as NgxScannerQrcodeComponent;
    component.startScanner();
    expect(handleSpy).toHaveBeenCalledWith(component.codeScanner, 'start');
  });

  it('should call handle with "stop" in stopScanner', () => {
    const handleSpy = spyOn(component, 'handle');
    component.codeScanner = {} as NgxScannerQrcodeComponent;
    component.stopScanner();
    expect(handleSpy).toHaveBeenCalledWith(component.codeScanner, 'stop');
  });

  it('should subscribe to isReady in ngAfterViewInit', () => {
    const isReadyEmitter = new EventEmitter<any>();
    component.codeScanner = { isReady: isReadyEmitter } as any;
    spyOn(isReadyEmitter, 'subscribe').and.callThrough();
    component.ngAfterViewInit();
    expect(isReadyEmitter.subscribe).toHaveBeenCalled();
  });

  it('should handle start in handle and call playDeviceDeviceFacingBack', fakeAsync(() => {
    const devices = [
      { label: 'front', deviceId: '1' },
      { label: 'back camera', deviceId: '2' }
    ];
    const playDeviceSpy = jasmine.createSpy('playDevice');
    const startSpy = jasmine.createSpy('start').and.callFake((cb: any) => {
      cb(devices);
      return { subscribe: (next: any, err: any) => next('started') };
    });
    const codeScannerMock = {
      start: startSpy,
      playDevice: playDeviceSpy
    };
    spyOn(console, 'log');
    component.handle(codeScannerMock, 'start');
    expect(startSpy).toHaveBeenCalled();
    expect(playDeviceSpy).toHaveBeenCalledWith('2');
  }));

  it('should handle start in handle and fallback to first device if no back camera', fakeAsync(() => {
    const devices = [
      { label: 'front', deviceId: '1' }
    ];
    const playDeviceSpy = jasmine.createSpy('playDevice');
    const startSpy = jasmine.createSpy('start').and.callFake((cb: any) => {
      cb(devices);
      return { subscribe: (next: any, err: any) => next('started') };
    });
    const codeScannerMock = {
      start: startSpy,
      playDevice: playDeviceSpy
    };
    spyOn(console, 'log');
    component.handle(codeScannerMock, 'start');
    expect(playDeviceSpy).toHaveBeenCalledWith('1');
  }));

  it('should handle stop in handle', () => {
    const stopSpy = jasmine.createSpy('stop').and.returnValue({
      subscribe: (next: any, err: any) => next('stopped')
    });
    const codeScannerMock = { stop: stopSpy };
    spyOn(console, 'log');
    component.handle(codeScannerMock, 'stop');
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should handle unknown function in handle', () => {
    const fnSpy = jasmine.createSpy('pause').and.returnValue({
      subscribe: (next: any, err: any) => next('paused')
    });
    const codeScannerMock = { pause: fnSpy };
    spyOn(console, 'log');
    component.handle(codeScannerMock, 'pause');
    expect(fnSpy).toHaveBeenCalled();
  });

  it('should handle error in handle subscribe', () => {
    const stopSpy = jasmine.createSpy('stop').and.returnValue({
      subscribe: (next: any, err: any) => err('error')
    });
    const codeScannerMock = { stop: stopSpy };
    spyOn(window, 'alert');
    component.handle(codeScannerMock, 'stop');
    expect(stopSpy).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('error');
  });

  // Edge: handle with undefined codeScanner
  it('should not throw if handle is called with undefined codeScanner', () => {
    expect(() => component.handle(undefined as any, 'start')).not.toThrow();
  });
});