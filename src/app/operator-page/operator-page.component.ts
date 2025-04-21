import { LogoutButtonComponent } from '../logout-button/logout-button.component';

import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SidebarComponent} from '../sidebar/sidebar.component';

@Component({
  selector: 'operator-page',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './operator-page.component.html',
  styleUrl: './operator-page.component.css'
})
export class OperatorPageComponent {

}
