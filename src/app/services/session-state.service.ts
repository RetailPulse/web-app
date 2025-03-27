import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {

  private errorMessage: string | null = null;
  
  constructor() { }  

  // Set the error message
  setErrorMessage(message: string): void {
    this.errorMessage = message;
  }

  // Get the error message
  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  // Clear the error message
  clearErrorMessage(): void {
    this.errorMessage = null;
  }
}
