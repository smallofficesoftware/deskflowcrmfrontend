const webpack = require("webpack");

module.exports = {
  webpack: {
    plugins: {
      add: [
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      ],
    },
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        "fs/promises": false,
        "node:fs": false,
        "node:fs/promises": false,
        path: false,
        "node:path": false,
        crypto: false,
        "node:crypto": false,
        stream: false,
        "node:stream": false,
        zlib: false,
        "node:zlib": false,
        url: false,
        "node:url": false,
      };
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        clawpdf: false,
        "@pdfme/converter": false,
      };
      return webpackConfig;
    },
  },
};
