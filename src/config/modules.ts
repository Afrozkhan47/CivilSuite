/**
 * Module Configuration
 *
 * Defines the active and future modules for CivilSuite.
 * Future modules are kept here so they can be re-enabled later
 * without restructuring the application.
 */

export type ModuleStatus = 'active' | 'coming_soon' | 'beta';

export interface ModuleConfig {
  id: string;
  label: string;
  description: string;
  /** lucide-react icon name (string) */
  iconName: string;
  /** Route, if navigable */
  href?: string;
  status: ModuleStatus;
  category: string;
}

/**
 * Active core modules shown in the sidebar.
 * Only Concrete Mix Design is the primary product for the current project.
 */
export const ACTIVE_MODULES: ModuleConfig[] = [
  {
    id: 'mod-dashboard',
    label: 'Dashboard',
    description: 'Overview of saved projects and recent activity',
    iconName: 'LayoutDashboard',
    href: '/',
    status: 'active',
    category: 'main',
  },
  {
    id: 'mod-concrete-mix-design',
    label: 'Concrete Mix Design',
    description: 'IS 10262:2019 compliant concrete mix design calculator',
    iconName: 'FlaskConical',
    href: '/concrete-mix-design',
    status: 'active',
    category: 'main',
  },
  {
    id: 'mod-saved-projects',
    label: 'Saved Projects',
    description: 'Manage and reopen previous mix design projects',
    iconName: 'FolderOpen',
    href: '/saved-projects',
    status: 'active',
    category: 'main',
  },
  {
    id: 'mod-reports',
    label: 'Reports',
    description: 'View and export mix design reports',
    iconName: 'FileText',
    href: '/reports',
    status: 'active',
    category: 'main',
  },
];

/**
 * Future modules — not yet implemented.
 * These are listed here so they remain in the codebase but are
 * NOT shown in the main navigation.
 * To re-enable a module, move it to ACTIVE_MODULES and implement its route.
 */
export const FUTURE_MODULES: ModuleConfig[] = [
  {
    id: 'mod-material-calculator',
    label: 'Material Calculator',
    description: 'Calculate material quantities for concrete works',
    iconName: 'Calculator',
    href: '/coming-soon/material-calculator',
    status: 'coming_soon',
    category: 'tools',
  },
  {
    id: 'mod-volume-calculator',
    label: 'Volume Calculator',
    description: 'Volume computation for structural elements',
    iconName: 'Box',
    href: '/coming-soon/volume-calculator',
    status: 'coming_soon',
    category: 'tools',
  },
  {
    id: 'mod-cost-estimator',
    label: 'Cost Estimator',
    description: 'Estimate project costs from mix quantities',
    iconName: 'DollarSign',
    href: '/coming-soon/cost-estimator',
    status: 'coming_soon',
    category: 'tools',
  },
  {
    id: 'mod-cube-strength',
    label: 'Cube Strength Record',
    description: 'Track and analyse concrete cube test results',
    iconName: 'ClipboardList',
    href: '/coming-soon/cube-strength',
    status: 'coming_soon',
    category: 'tools',
  },
  {
    id: 'mod-unit-converter',
    label: 'Unit Converter',
    description: 'Convert between engineering units',
    iconName: 'ArrowLeftRight',
    href: '/coming-soon/unit-converter',
    status: 'coming_soon',
    category: 'tools',
  },
  {
    id: 'mod-settings',
    label: 'Settings',
    description: 'Application settings and preferences',
    iconName: 'Settings',
    href: '/coming-soon/settings',
    status: 'coming_soon',
    category: 'system',
  },
  {
    id: 'mod-rcc-beam',
    label: 'RCC Beam Design',
    description: 'IS 456:2000 reinforced concrete beam design',
    iconName: 'Layers',
    status: 'coming_soon',
    category: 'structural',
  },
  {
    id: 'mod-rcc-slab',
    label: 'RCC Slab Design',
    description: 'IS 456:2000 reinforced concrete slab design',
    iconName: 'Grid3X3',
    status: 'coming_soon',
    category: 'structural',
  },
  {
    id: 'mod-rcc-column',
    label: 'RCC Column Design',
    description: 'IS 456:2000 reinforced concrete column design',
    iconName: 'Columns',
    status: 'coming_soon',
    category: 'structural',
  },
  {
    id: 'mod-rcc-footing',
    label: 'RCC Footing Design',
    description: 'IS 456:2000 reinforced concrete footing design',
    iconName: 'Triangle',
    status: 'coming_soon',
    category: 'structural',
  },
];
