/**
 * @fileoverview Custom Next.js Document component that controls the initial
 * HTML shell served to the browser.
 *
 * @description Defines the base HTML structure (`<html>`, `<head>`, `<body>`)
 * for every page. This is rendered server-side only and is not re-rendered
 * on client navigation. Use this to set global `<head>` metadata, language
 * attributes, or scripts that must load before hydration.
 *
 * @see {@link https://nextjs.org/docs/pages/building-your-application/routing/custom-document}
 */

import { Html, Head, Main, NextScript } from "next/document";

/**
 * Custom Document component rendered on the server to produce the initial
 * HTML document shell.
 *
 * @returns {JSX.Element} The root HTML document containing Head, Main content
 *   slot, and Next.js client-side hydration script.
 */
export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}