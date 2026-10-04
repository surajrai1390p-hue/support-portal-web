/**
 * @fileoverview Custom Next.js App component that wraps the entire application
 * with global providers: Redux store (with persistence), Ant Design theming,
 * and CSS-in-JS style registry.
 *
 * @description This is the root layout applied to every page. It initializes
 * Redux state hydration via redux-persist and configures Ant Design's theme
 * and server-side style extraction via @ant-design/nextjs-registry.
 *
 * @see {@link https://nextjs.org/docs/pages/building-your-application/routing/custom-app}
 */

import type { AppProps } from "next/app";
import { ConfigProvider, App } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import theme from "@/src/config/themeConfig";
import "@/styles/globals.css";
import "@/styles/complaints.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/src/store/store";

/**
 * Root application wrapper component.
 *
 * @param {AppProps} props - Standard Next.js AppProps containing the page
 *   Component and its server-rendered pageProps.
 * @returns {JSX.Element} The fully-wrapped application tree with Redux,
 *   persistence, Ant Design theming, and style registry providers.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}>
        <ConfigProvider theme={theme}>
          <AntdRegistry>
            <App>
              <Component {...pageProps} />
            </App>
          </AntdRegistry>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}