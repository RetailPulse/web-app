import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { apiConfig } from '../../environments/environment';
import { ProductService } from './product.service';
import { Product } from './product.model';

describe('ProductService', () => {
  let service: ProductService;
  let httpTestingController: HttpTestingController;
  const apiUrl = `${apiConfig.inventory_api_url}api/products`;

  const mockProducts: Product[] = [
    {
      id: 1,
      sku: 'SKU001',
      brand: 'Brand A',
      category: 'Electronics',
      subcategory: 'Mobile',
      description: 'Product 1',
      rrp: 100,
      barcode: '123',
      origin: 'China',
      uom: 'EA',
      vendorCode: 'VC001',
      active: true
    },
    {
      id: 2,
      sku: 'SKU002',
      brand: 'Brand B',
      category: 'Apparel',
      subcategory: 'Shirt',
      description: 'Product 2',
      rrp: 50,
      barcode: '456',
      origin: 'USA',
      uom: 'EA',
      vendorCode: 'VC002',
      active: false
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService
      ],
    });
    service = TestBed.inject(ProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should perform a GET request to the correct URL', () => {
      service.getProducts().subscribe();
      const req = httpTestingController.expectOne(apiUrl);
      expect(req.request.method).toEqual('GET');
      req.flush([]);
    });

    it('should return an array of products', () => {
      service.getProducts().subscribe((products) => {
        expect(products).toEqual(mockProducts);
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.flush(mockProducts);
    });

    it('should return empty array when server returns null', () => {
      service.getProducts().subscribe((products) => {
        expect(products).toEqual([]);
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.flush(null);
    });

    it('should handle 404 error', () => {
      service.getProducts().subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toContain('Not found');
        }
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.getProducts().subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('createProduct', () => {
    const newProduct: Product = {
      sku: 'NEW001',
      brand: 'New Brand',
      category: 'Other',
      rrp: 25
    } as Product;
    const createdProduct: Product = {
      ...newProduct,
      active: true
    };

    it('should perform a POST request to the correct URL with the new product', () => {
      service.createProduct(newProduct).subscribe();
      const req = httpTestingController.expectOne(apiUrl);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(newProduct);
      req.flush(createdProduct);
    });

    it('should return the created product', () => {
      service.createProduct(newProduct).subscribe((product) => {
        expect(product).toEqual(createdProduct);
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.flush(createdProduct);
    });

    it('should handle 400 Bad Request error', () => {
      const errorMessage = 'Missing required fields';

      service.createProduct(newProduct).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toEqual(400);
          expect(error.error).toEqual(errorMessage);
        }
      });

      const req = httpTestingController.expectOne(apiUrl);
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 409 Conflict for duplicate product', () => {
      const errorMessage = 'Product with this SKU already exists';

      service.createProduct(newProduct).subscribe({
        next: () => fail('should have failed with 409 error'),
        error: (error) => {
          expect(error.status).toEqual(409);
          expect(error.error).toEqual(errorMessage);
        }
      });

      const req = httpTestingController.expectOne(apiUrl);
      req.flush(errorMessage, { status: 409, statusText: 'Conflict' });
    });

    it('should handle 404 error', () => {
      service.createProduct(newProduct).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toContain('Not found');
        }
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.createProduct(newProduct).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });
      const req = httpTestingController.expectOne(apiUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('updateProduct', () => {
    const updatedProduct: Product = {
      id: 1,
      sku: 'SKU001-UPD',
      brand: 'Brand A Updated',
      category: 'Electronics',
      rrp: 110
    } as Product;
    const updateUrl = `${apiUrl}/${updatedProduct.id}`;

    it('should perform a PUT request to the correct URL with the updated product', () => {
      service.updateProduct(updatedProduct).subscribe();
      const req = httpTestingController.expectOne(updateUrl);
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(updatedProduct);
      req.flush(updatedProduct);
    });

    it('should return the updated product', () => {
      service.updateProduct(updatedProduct).subscribe((product) => {
        expect(product).toEqual(updatedProduct);
      });
      const req = httpTestingController.expectOne(updateUrl);
      req.flush(updatedProduct);
    });

    it('should handle 400 Bad Request for invalid data', () => {
      const errorMessage = 'Invalid product data';

      service.updateProduct(updatedProduct).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toEqual(400);
          expect(error.error).toEqual(errorMessage);
        }
      });

      const req = httpTestingController.expectOne(updateUrl);
      req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 404 error', () => {
      service.updateProduct(updatedProduct).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toContain('Not found');
        }
      });
      const req = httpTestingController.expectOne(updateUrl);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.updateProduct(updatedProduct).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });
      const req = httpTestingController.expectOne(updateUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('deleteProduct', () => {
    const productId = '123';
    const deleteUrl = `${apiUrl}/${productId}`;

    it('should perform a DELETE request to the correct URL', () => {
      service.deleteProduct(productId).subscribe();
      const req = httpTestingController.expectOne(deleteUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush({});
    });

    it('should handle 403 Forbidden error', () => {
      service.deleteProduct(productId).subscribe({
        next: () => fail('should have failed with 403 error'),
        error: (error) => {
          expect(error.status).toEqual(403);
          expect(error.error).toContain('Not authorized');
        }
      });

      const req = httpTestingController.expectOne(deleteUrl);
      req.flush('Not authorized', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 error', () => {
      service.deleteProduct(productId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toContain('Not found');
        }
      });
      const req = httpTestingController.expectOne(deleteUrl);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.deleteProduct(productId).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });
      const req = httpTestingController.expectOne(deleteUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('reverseProduct', () => {
    const productId = 1;
    const reverseUrl = `${apiUrl}/reverseSoftDelete/${productId}`;
    const reactivatedProduct: Product = mockProducts[0];

    it('should perform a PUT request to the correct URL', () => {
      service.reverseProduct(productId).subscribe();
      const req = httpTestingController.expectOne(reverseUrl);
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toBeNull();
      req.flush(reactivatedProduct);
    });

    it('should return the reactivated product', () => {
      service.reverseProduct(productId).subscribe((product) => {
        expect(product).toEqual(reactivatedProduct);
        expect(product.active).toBeTrue();
      });
      const req = httpTestingController.expectOne(reverseUrl);
      req.flush(reactivatedProduct);
    });

    it('should handle 400 Bad Request when product is already active', () => {
      service.reverseProduct(productId).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toEqual(400);
          expect(error.error).toContain('Product is already active');
        }
      });

      const req = httpTestingController.expectOne(reverseUrl);
      req.flush('Product is already active', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 404 error', () => {
      service.reverseProduct(productId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toContain('Not found');
        }
      });
      const req = httpTestingController.expectOne(reverseUrl);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.reverseProduct(productId).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });
      const req = httpTestingController.expectOne(reverseUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('getProductById', () => {
    const productId = 2;
    const getByIdUrl = `${apiUrl}/${productId}`;
    const singleProduct = mockProducts[1];

    it('should perform a GET request to the correct URL', () => {
      service.getProductById(productId).subscribe();
      const req = httpTestingController.expectOne(getByIdUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(singleProduct);
    });

    it('should return the product with the given ID', () => {
      service.getProductById(productId).subscribe((product) => {
        expect(product).toEqual(singleProduct);
        expect(product.id).toEqual(productId);
      });
      const req = httpTestingController.expectOne(getByIdUrl);
      req.flush(singleProduct);
    });

    it('should handle 403 Forbidden error', () => {
      service.getProductById(productId).subscribe({
        next: () => fail('should have failed with 403 error'),
        error: (error) => {
          expect(error.status).toEqual(403);
          expect(error.error).toContain('Not authorized');
        }
      });

      const req = httpTestingController.expectOne(getByIdUrl);
      req.flush('Not authorized', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 error', () => {
      service.getProductById(productId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toContain('Not found');
        }
      });
      const req = httpTestingController.expectOne(getByIdUrl);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', () => {
      service.getProductById(productId).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });
      const req = httpTestingController.expectOne(getByIdUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });
});