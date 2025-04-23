import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  template: '', // Abstract component has no template
})
export abstract class InputScanner {
  // Abstract method to initialize the scanner
  abstract startScanner(): void;

  // Abstract method to stop or clean up the scanner
  abstract stopScanner(): void;

  // Abstract event emitter for scan events
  @Output() abstract scannedEvent: EventEmitter<string>;
}