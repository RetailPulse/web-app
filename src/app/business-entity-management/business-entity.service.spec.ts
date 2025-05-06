import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { BusinessEntityService } from './business-entity.service';
import { BusinessEntity, BusinessEntityDTO } from './business-entity.model';
import { apiConfig } from '../../environments/environment';

describe('BusinessEntityService', () => {
  let service: BusinessEntityService;
  let httpMock: HttpTestingController;
  const apiUrl = `${apiConfig.backend_api_url}api/businessEntity`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BusinessEntityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all business entities', () => {
    const mockEntities: BusinessEntity[] = [
      { id: 1, name: 'Entity 1', location: 'Location 1', type: 'Shop', active: true, external: false },
      { id: 2, name: 'Entity 2', location: 'Location 2', type: 'Supplier', active: true, external: true },
    ];

    service.getBusinessEntities().subscribe((entities) => {
      expect(entities).toEqual(mockEntities);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockEntities);
  });

  it('should handle error when fetching all business entities', () => {
    const errorMessage = 'Failed to fetch business entities';

    service.getBusinessEntities().subscribe({
      next: () => fail('Expected an error, but got a response'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
      },
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ message: errorMessage }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should create a new business entity', () => {
    const newEntity: BusinessEntity = {
      id: 3,
      name: 'Entity 3',
      location: 'Location 3',
      type: 'Central Inventory',
      active: true,
      external: false,
    };

    const dto: BusinessEntityDTO = {
      name: newEntity.name,
      location: newEntity.location,
      type: newEntity.type,
      external: newEntity.external,
    };

    service.createBusinessEntity(newEntity).subscribe((createdEntity) => {
      expect(createdEntity).toEqual(newEntity);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(newEntity);
  });

  it('should handle error when creating a new business entity', () => {
    const newEntity: BusinessEntity = {
      id: 3,
      name: 'Entity 3',
      location: 'Location 3',
      type: 'Central Inventory',
      active: true,
      external: false,
    };

    const errorMessage = 'Failed to create business entity';

    service.createBusinessEntity(newEntity).subscribe({
      next: () => fail('Expected an error, but got a response'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
      },
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
  });

  it('should edit an existing business entity', () => {
    const updatedEntity: BusinessEntity = {
      id: 1,
      name: 'Updated Entity',
      location: 'Updated Location',
      type: 'Shop',
      active: true,
      external: false,
    };

    const dto: BusinessEntityDTO = {
      name: updatedEntity.name,
      location: updatedEntity.location,
      type: updatedEntity.type,
      external: updatedEntity.external,
    };

    service.editUser(updatedEntity).subscribe((editedEntity) => {
      expect(editedEntity).toEqual(updatedEntity);
    });

    const req = httpMock.expectOne(`${apiUrl}/${updatedEntity.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updatedEntity);
  });

  it('should handle error when editing a business entity', () => {
    const updatedEntity: BusinessEntity = {
      id: 1,
      name: 'Updated Entity',
      location: 'Updated Location',
      type: 'Shop',
      active: true,
      external: false,
    };

    const errorMessage = 'Failed to edit business entity';

    service.editUser(updatedEntity).subscribe({
      next: () => fail('Expected an error, but got a response'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/${updatedEntity.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
  });

  it('should delete a business entity', () => {
    const entityId = 1;

    service.deleteBusinessEntity(entityId).subscribe((response) => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/${entityId}`);
    expect(req.request.method).toBe('DELETE');    
  });

  it('should handle error when deleting a business entity', () => {
    const entityId = 1;
    const errorMessage = 'Failed to delete business entity';

    service.deleteBusinessEntity(entityId).subscribe({
      next: () => fail('Expected an error, but got a response'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/${entityId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: errorMessage }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('should fetch a business entity by ID', () => {
    const mockEntity: BusinessEntity = {
      id: 1,
      name: 'Entity 1',
      location: 'Location 1',
      type: 'Shop',
      active: true,
      external: false,
    };

    service.getBusinessEntityById(mockEntity.id).subscribe((entity) => {
      expect(entity).toEqual(mockEntity);
    });

    const req = httpMock.expectOne(`${apiUrl}/${mockEntity.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEntity);
  });

  it('should handle error when fetching a business entity by ID', () => {
    const entityId = 1;
    const errorMessage = 'Failed to fetch business entity';

    service.getBusinessEntityById(entityId).subscribe({
      next: () => fail('Expected an error, but got a response'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/${entityId}`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: errorMessage }, { status: 404, statusText: 'Not Found' });
  });
});