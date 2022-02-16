const path = require('path')
const ROOT = path.resolve(__dirname, 'src/app')
const DESTINATION = path.resolve(__dirname, 'dist')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const packageJson = require('./package.json')

// const BundleAnalyzerPlugin =
//     require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
    context: ROOT,
    mode: 'development',
    entry: {
        main: './main.ts',
        //'dependencies': './dependencies-loader.ts'
    },
    experiments: {
        topLevelAwait: true,
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.[contenthash].css',
            insert: '#css-anchor',
        }),
        new HtmlWebpackPlugin({
            //hash: true,
            title: 'Flux Builder',
            template: './index.html',
            filename: './index.html',
            baseHref: `/applications/${packageJson.name}/${packageJson.version}/`,
        }),
        //new BundleAnalyzerPlugin()
    ],
    output: {
        filename: '[name].[contenthash].js',
        path: DESTINATION,
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [ROOT, 'node_modules'],
    },
    externals: [
        {
            lodash: '_',
            rxjs: 'rxjs',
            marked: 'marked',
            'js-beautify': "window['js-beautify']",
            'rxjs/operators': "window['rxjs']['operators']",
            '@youwol/logging': "window['@youwol/logging']",
            '@youwol/http-clients': "window['@youwol/http-clients']",
            '@youwol/cdn-client': "window['@youwol/cdn-client']",
            '@youwol/flux-core': "window['@youwol/flux-core']",
            '@youwol/flux-view': "window['@youwol/flux-view']",
            '@youwol/flux-files': "window['@youwol/flux-files']",
            '@youwol/fv-group': "window['@youwol/fv-group']",
            '@youwol/fv-input': "window['@youwol/fv-input']",
            '@youwol/fv-tree': "window['@youwol/fv-tree']",
            '@youwol/fv-tabs': "window['@youwol/fv-tabs']",
            '@youwol/fv-button': "window['@youwol/fv-button']",
            '@youwol/fv-context-menu': "window['@youwol/fv-context-menu']",
            '@youwol/platform-essentials':
                "window['@youwol/platform-essentials']",
            '@youwol/flux-fv-widgets': "window['@youwol/flux-fv-widgets']",
            'highlight.js': 'hljs',
        },
    ],
    module: {
        rules: [
            /****************
             * PRE-LOADERS
             *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader',
            },

            /****************
             * LOADERS
             *****************/
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: 'ts-loader',
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        //contentBase: path.resolve(__dirname, "./src"),
        historyApiFallback: true,
        open: false,
        port: 3001,
    },
}
