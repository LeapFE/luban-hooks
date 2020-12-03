const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const mockServer = require("./mock");

module.exports = {
  mode: "development",
  entry: path.join(process.cwd(), "./example/index.tsx"),
  module: {
    rules: [
      {
        test: /\.ts[x]?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./example/index.html",
    }),
  ],
  devServer: {
    host: "0.0.0.0",
    port: 3000,
    clientLogLevel: "info",
    historyApiFallback: true,
    watchContentBase: true,
    hot: true,
    compress: true,
    publicPath: "/",
    overlay: { warnings: false, errors: true },
    open: true,
    stats: {
      version: true,
      timings: true,
      colors: true,
      modules: false,
      children: false,
    },

    before: (app) => {
      mockServer(app);
    },
  },
};
