import type { NextConfig } from "next";
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig: NextConfig = {
  // experimental: {
  //   instrumentationHook: true, // Required for Sentry server-side init
  // },
  /* config options here */
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, configFile, stripPrefix, urlPrefix, include, ignore

  org: process.env.SENTRY_ORG, // Required: Get this from Sentry organization settings
  project: process.env.SENTRY_PROJECT, // Required: Get this from Sentry project settings

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
};

// Make sure to pipe your Next.js config through the Sentry config wrapper:
export default withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions,
  // Optional SDK options can be passed here
  // {
  //   // For example, adjust tracesSampleRate:
  //   tracesSampleRate: 0.1,
  // }
);
