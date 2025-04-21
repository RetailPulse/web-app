import {SidebarItem} from '../sidebar.interface';

export interface ISidebarStrategy {
  getMenuItems(): SidebarItem[];
}
