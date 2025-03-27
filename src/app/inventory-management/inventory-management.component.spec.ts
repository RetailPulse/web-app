import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryManagementComponent } from './inventory-management.component';
import { HttpClientModule } from '@angular/common/http';
import {BusinessEntityService} from '../business-entity-management/business-entity.service';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [HttpClientModule], // Add this
    providers: [BusinessEntityService] // Ensure this service is included
  }).compileComponents();
});

describe('ProductManagementComponent', () => {
  let component: InventoryManagementComponent;
  let fixture: ComponentFixture<InventoryManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
