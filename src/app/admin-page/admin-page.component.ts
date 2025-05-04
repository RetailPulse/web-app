import { SidebarComponent } from '../sidebar/sidebar.component';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'admin-page',
  imports: [
    RouterModule,
    SidebarComponent,
  ],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.css',
  standalone: true
})
export class AdminPageComponent {

}
