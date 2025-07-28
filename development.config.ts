const { readdirSync } = require('fs');
const path = require('path');
import 'webpack-dev-server';

const HtmlWebpackPlugin = require('html-webpack-plugin');
import * as webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import configs from './webpack.config';
import { mockAdBefore } from './src/admock';

process.env.NODE_ENV = 'development';

const useLocalServer = process.env.USE_LOCAL_SERVER === 'true';
const useAnalyze = process.env.USE_ANALYZE === 'true';

if (useLocalServer) {
  process.env.DEBUG_DOMAIN =
    process.env.DEBUG_DOMAIN || 'http://bs-local.com:3111';
  process.env.DEBUG_PUBLIC =
    process.env.DEBUG_PUBLIC || 'http://bs-local.com:3111/public';
}

const devPlugins: webpack.Configuration['plugins'] = [];

if (useAnalyze) {
  devPlugins.push(new BundleAnalyzerPlugin());
}

if (useLocalServer) {
  const pushFile = (file: string, base: string): void => {
    devPlugins.push(
      new HtmlWebpackPlugin({
        filename: path.resolve('dist', file),
        template: path.resolve(base, file),
        templateParameters: {
          DEBUG_DOMAIN: JSON.stringify(process.env.DEBUG_DOMAIN),
        },
        inject: false,
      })
    );
  };

  const registerFiles = (dirPath: string, base: string): void => {
    readdirSync(dirPath, { withFileTypes: true }).forEach((dirent) => {
      const fp = path.join(dirPath, dirent.name);
      if (dirent.isDirectory()) {
        registerFiles(fp, `${base}/${dirent.name}`);
      } else {
        pushFile(dirent.name, base);
      }
    });
  };

  // Read all files under `template` folders
  registerFiles(path.join(__dirname, 'template'), 'template');
}

export default configs.map((config) => {
  if (useLocalServer) {
    config.entry = (config.entry || {}) as webpack.Entry;
    (config.entry as webpack.EntryObject)['debug-vw'] = ['./debug/debug-vw'];
    (config.entry as webpack.EntryObject)['debugger'] = ['./debug/debugger'];
    const devServer = {
      host: '0.0.0.0',
      port: 3111,
      static: [path.join(__dirname, '/'), path.join(__dirname, '/dist')],
      devMiddleware: {
        publicPath: '/',
      },
      historyApiFallback: { index: 'index.html' },
      onBeforeSetupMiddleware: (devServer: any) => mockAdBefore(devServer.app),
      allowedHosts: 'all',
    };

    config.devServer = {
      ...devServer,
      hot: false,
      compress: true,
    };
  }
  return {
    ...config,
    // devTool is enabled on stg/dev if needed, not only local development environment
    devtool: 'inline-source-map',
    plugins: [...(config.plugins as any[]), ...devPlugins],
  } as webpack.Configuration;
});
