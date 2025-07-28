import * as child_process from 'child_process';
import * as path from 'path';

const CopyPlugin = require('copy-webpack-plugin');
import * as TerserPlugin from 'terser-webpack-plugin';
import * as webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import * as pkg from './package.json';

// Note: --mode option doesn't affect on process.env.NODE_ENV outside DefinePlugin
// - refer to https://webpack.js.org/configuration/mode/
// isDevMode is used both local and deployment
const isDevMode =
  process.argv[process.argv.indexOf('--mode') + 1] === 'development';
if (isDevMode) {
  process.env.NODE_ENV = 'development';
} else {
  process.env.NODE_ENV = 'production';
}

const version = pkg.version;
const revision = child_process
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

process.env.AD_ENDPOINT =
  process.env.AD_ENDPOINT || `http://bs-local.com:3111/ad-proxy`;
process.env.VIEWABILITY_ENDPOINT =
  process.env.VIEWABILITY_ENDPOINT || `http://bs-local.com:3111/vw.js`;
process.env.RETARGETING_ENDPOINT =
  process.env.RETARGETING_ENDPOINT || `http://bs-local.com:3111/rtg`;
process.env.ACTIVITY_ENDPOINT =
  process.env.ACTIVITY_ENDPOINT || `http://bs-local.com:3111/activity`;
process.env.ERROR_LOGGING_ENDPOINT =
  process.env.ERROR_LOGGING_ENDPOINT || 'http://bs-local.com:3111/error-log';
process.env.IMAGE_PATH =
  process.env.IMAGE_PATH || `http://bs-local.com:3111/images`;

let envs: { [key: string]: string } = {
  AD_ENDPOINT: JSON.stringify(process.env.AD_ENDPOINT),
  VIEWABILITY_ENDPOINT: JSON.stringify(process.env.VIEWABILITY_ENDPOINT),
  RETARGETING_ENDPOINT: JSON.stringify(process.env.RETARGETING_ENDPOINT),
  ACTIVITY_ENDPOINT: JSON.stringify(process.env.ACTIVITY_ENDPOINT),
  NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
  REVISION: JSON.stringify(revision),
  VERSION: JSON.stringify(version),
  ERROR_LOGGING_ENDPOINT: JSON.stringify(process.env.ERROR_LOGGING_ENDPOINT),
  IMAGE_PATH: JSON.stringify(process.env.IMAGE_PATH),
};

// MEMO: for debug
const useLocalServer = process.env.USE_LOCAL_SERVER === 'true';
if (useLocalServer) {
  process.env.DEBUG_DOMAIN =
    process.env.DEBUG_DOMAIN || 'http://bs-local.com:3111';
  process.env.DEBUG_PUBLIC =
    process.env.DEBUG_PUBLIC || 'http://bs-local.com:3111/public';
  envs = {
    TEST_DRIVERS: JSON.stringify(process.env.TEST_DRIVERS),
    BROWSER_STACK_USER: JSON.stringify(process.env.BROWSER_STACK_USER),
    BROWSER_STACK_KEY: JSON.stringify(process.env.BROWSER_STACK_KEY),
    BROWSER_STACK_LOCAL_IDENTIFIER: JSON.stringify(
      process.env.BROWSER_STACK_LOCAL_IDENTIFIER
    ),
    BROWSER_STACK_LOCAL_BINARY: JSON.stringify(
      process.env.BROWSER_STACK_LOCAL_BINARY
    ),
    DEBUG_DOMAIN: JSON.stringify(process.env.DEBUG_DOMAIN),
    DEBUG_PUBLIC: JSON.stringify(process.env.DEBUG_PUBLIC),
    ...envs,
  };
}

console.log(`envs:`, envs);

let usePlugins = [
  new webpack.DefinePlugin({
    'process.env': envs,
  }),
  // MEMO: It's for temporary thumbnails in video ad.
  new CopyPlugin({
    patterns: [{ from: path.join(__dirname, 'images'), to: 'images' }],
  }),
];

if (!isDevMode) {
  usePlugins = [...usePlugins, new webpack.optimize.AggressiveMergingPlugin()];
}

const useAnalyze = process.env.USE_ANALYZE === 'true';
if (useAnalyze) {
  usePlugins.push(new BundleAnalyzerPlugin());
}

export default [
  {
    cache: true,
    context: path.join(__dirname, 'src'),
    name: 'rssp.js',
    target: 'web',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      alias: {
        '@src': path.resolve(__dirname, 'src'),
      },
    },

    entry: {
      aa: ['./aa'],
      vw: ['./vw'],
      cd: ['./cd'],
      rtg: ['./rtg'],
      amp: ['./amp'],
      activity: ['./activity'],
    } as webpack.Entry,

    output: {
      filename: `[name].js`,
      path: path.join(__dirname, 'dist'),
      publicPath: '/dist/',
    },

    module: {
      rules: [
        {
          include: path.join(__dirname, 'src'),
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          include: path.join(__dirname, 'node_modules/vast-client'),
          test: /\.js$/,
          use: 'babel-loader',
        },
        {
          test: /\.json$/,
          use: {
            loader: 'json-loader',
          },
        },
        {
          enforce: 'pre',
          test: /\.js$/,
          use: {
            loader: 'source-map-loader',
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: usePlugins,
    optimization: {
      chunkIds: 'total-size',
      moduleIds: 'deterministic',
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 5,
            compress: { drop_console: process.env.IS_DEBUG_LOG !== 'true' },
            output: {
              comments: false,
              beautify: false,
            },
          },
        }),
      ],
      concatenateModules: true,
    },
  },
] as webpack.Configuration[];
