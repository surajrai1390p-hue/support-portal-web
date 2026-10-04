/**
 * @file Ant Design theme configuration.
 *
 * Exports the global Ant Design `ThemeConfig` object that controls the
 * visual appearance of every Ant Design component rendered by the app
 * (primary colour, border-radius, font sizes, etc.).
 */

import type { ThemeConfig } from 'antd';

/**
 * Global Ant Design theme settings.
 *
 * Currently sets the primary brand colour to green (`#52c41a`).
 * Extend this object to customise spacing, typography, or component
 * tokens across the application.
 */
const theme: ThemeConfig = {
  token: {
    
    colorPrimary: '#52c41a',
  },
};



export default theme;
