import {Injectable} from '@angular/core';
import {ISidebarStrategy} from './sidebar.strategy';
import {SidebarItem} from '../sidebar.interface';

@Injectable({ providedIn: 'root' })
export class CashierSidebarStrategy implements ISidebarStrategy {
  getMenuItems(): SidebarItem[] {
    return [
      {
        icon: 'pi-shopping-bag',
        text: 'POS System',
        route: './pos-system',
        visible: true
      },
      {
        icon: 'pi-user',
        text: 'Profile',
        route: './profile',
        visible: true
      }
    ];
  }
}
