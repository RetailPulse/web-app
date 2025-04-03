import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxScannerqrcodeAdapterComponent } from './ngx-scannerqrcode-adapter.component';

describe('NgxScannerqrcodeAdapterComponent', () => {
  let component: NgxScannerqrcodeAdapterComponent;
  let fixture: ComponentFixture<NgxScannerqrcodeAdapterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxScannerqrcodeAdapterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxScannerqrcodeAdapterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
