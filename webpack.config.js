module.exports = {
  module: {
    rules: [
      {
        // Handle WASM files from ghostty-web
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/wasm/[name][ext]'
        }
      }
    ]
  },
  experiments: {
    asyncWebAssembly: true
  }
};
