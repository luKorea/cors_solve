const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './client/src/proxy',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build')
    },
    devServer: {
        port: 3001,
        progress: true, // 显示加载的进度
        contentBase: path.resolve(__dirname, 'build'),
        proxy: {
            '/': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true
            }
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './client/src/proxy/index.html',
            filename: 'index.html'
        })
    ]
}