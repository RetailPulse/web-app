import { Injectable } from '@angular/core';
import { AdminSidebarStrategy } from '../strategyMethod/admin-sidebar.strategy';
import { ManagerSidebarStrategy } from '../strategyMethod/manager-sidebar.strategy';
import { CashierSidebarStrategy } from '../strategyMethod/cashier-sidebar.strategy';
import { ISidebarStrategy } from '../strategyMethod/sidebar.strategy';
import {AuthFacade} from '../../services/auth.facade';

@Injectable({ providedIn: 'root' })
export class SidebarFactory {
  constructor(
    private adminStrategy: AdminSidebarStrategy,
    private managerStrategy: ManagerSidebarStrategy,
    private cashierStrategy: CashierSidebarStrategy,
    private authService: AuthFacade
  ) {}

  createStrategy(): ISidebarStrategy {
    const userRoles = this.authService.getUserRole();

    if (userRoles.includes('UNAUTHORIZED') || userRoles.length === 0) {
      return this.cashierStrategy;
    }

    if (userRoles.includes('ADMIN')) {
      return this.adminStrategy;
    }

    if (userRoles.includes('MANAGER')) {
      return this.managerStrategy;
    }

    if (userRoles.includes('CASHIER')) {
      return this.cashierStrategy;
    }
    // Default case, return cashier strategy
    return this.cashierStrategy;
  }
}
