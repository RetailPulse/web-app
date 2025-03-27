import { Component, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';

import { LogoutButtonComponent } from '../logout-button/logout-button.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [
    RouterModule,
    LogoutButtonComponent
    ],
  animations: [
    trigger('sidebarState', [
      state('closed', style({
        transform: 'translateX(-100%)',
        visibility: 'hidden'
      })),
      state('open', style({
        transform: 'translateX(0)',
        visibility: 'visible'
      })),
      transition('closed <=> open', [
        animate('0.3s ease')
      ])
    ])
  ]
})
export class SidebarComponent {
  sidebarVisible = false;

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sidebar') && !target.closest('.sidebar-toggle-btn')) {
      this.sidebarVisible = false;
    }
  }
}
