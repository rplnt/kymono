import path from 'path'
import { fileURLToPath } from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const mode = process.argv.includes('--mode=production') || process.argv.includes('production')
  ? 'production'
  : process.argv.includes('--mode=development') || process.argv.includes('development')
    ? 'development'
    : 'production'
const isProduction = mode === 'production'

export default {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, isProduction ? 'dist' : 'dist-debug'),
    filename: isProduction ? 'bundle.js' : 'bundle-debug.js',
    publicPath: '/',
    clean: true
  },
  devtool: isProduction ? false : 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: isProduction ? 1 : 0 } },
          ...(isProduction ? [{
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['cssnano', { preset: ['default', { discardComments: { removeAll: true } }] }]],
              },
            },
          }] : []),
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body'
    }),
  ],
  devServer: {
    static: './dist',
    hot: true,
    port: 5173,
    historyApiFallback: true
  }
}
