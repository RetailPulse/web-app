import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxScannerQRCodeAdapterComponent } from './ngx-scannerqrcode-adapter.component';

describe('NgxScannerQRCodeAdapterComponent', () => {
  let component: NgxScannerQRCodeAdapterComponent;
  let fixture: ComponentFixture<NgxScannerQRCodeAdapterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxScannerQRCodeAdapterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxScannerQRCodeAdapterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
