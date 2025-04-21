import {Injectable} from '@angular/core';
import {ISidebarStrategy} from './sidebar.strategy';
import {SidebarItem} from '../sidebar.interface';

@Injectable({ providedIn: 'root' })
export class AdminSidebarStrategy implements ISidebarStrategy {
  getMenuItems(): SidebarItem[] {
    return [
      {
        icon: 'pi-shopping-bag',
        text: 'POS System',
        route: './pos-system',
        visible: true
      },
      {
        icon: 'pi-shop',
        text: 'Business Entities',
        route: './business-entity-management',
        visible: true
      },
      {
        icon: 'pi-box',
        text: 'Product Catalog',
        route: './product-management',
        visible: true
      },
      {
        icon: 'pi-book',
        text: 'Inventory Management',
        route: './inventory-management',
        visible: true
      },
      {
        icon: 'pi-users',
        text: 'User Management',
        route: './user-management',
        visible: true
      },
      {
        icon: 'pi-chart-line',
        text: 'Reports',
        route: './report-generation',
        visible: true
      },
      {
        icon: 'pi-user',
        text: 'Profile',
        route: './profile',
        visible: true
      },
      {
        icon: 'pi-chart-bar',
        text: 'Report Generation',
        route: './report-generation',
        visible: true
      },
      {
        icon: 'pi-user',
        text: 'My Profile',
        route: './profile',
        visible: true
      }
    ];
  }
}
