// sidebar.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';
import { CommonModule } from '@angular/common';
import {SidebarItem} from './sidebar.interface';
import {SidebarFactory} from './factoryMethod/sidebar.factory';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, LogoutButtonComponent, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
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
export class SidebarComponent implements OnInit {
  sidebarVisible = false;
  sidebarItems: SidebarItem[] = [];

  constructor(private sidebarFactory: SidebarFactory) {}

  ngOnInit() {
    this.sidebarItems = this.sidebarFactory.createStrategy().getMenuItems();
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sidebar') && !target.closest('.sidebar-toggle')) {
      this.sidebarVisible = false;
    }
  }
}
