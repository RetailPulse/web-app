import { SessionStateService } from './session-state.service';

describe('SessionStateService', () => {
  let service: SessionStateService;

  beforeEach(() => {
    service = new SessionStateService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get error message', () => {
    service.setErrorMessage('Test error');
    expect(service.getErrorMessage()).toBe('Test error');
  });

  it('should clear error message', () => {
    service.setErrorMessage('Test error');
    service.clearErrorMessage();
    expect(service.getErrorMessage()).toBeNull();
  });

  it('should return null if error message was never set', () => {
    expect(service.getErrorMessage()).toBeNull();
  });

  it('should overwrite previous error message', () => {
    service.setErrorMessage('First error');
    service.setErrorMessage('Second error');
    expect(service.getErrorMessage()).toBe('Second error');
  });

  it('should handle clearing when error message is already null', () => {
    service.clearErrorMessage();
    expect(service.getErrorMessage()).toBeNull();
  });
});