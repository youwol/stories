const path = require('path');
const webpack = require('webpack');
const ROOT = path.resolve( __dirname, 'src/app' );
const DESTINATION = path.resolve( __dirname, 'dist' );
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    context: ROOT,
    mode: 'development',
    entry: {
        'main': './main.ts',
        //'dependencies': './dependencies-loader.ts'
    },
    experiments: {
        topLevelAwait: true
    },
    plugins: [
        new MiniCssExtractPlugin( {
            filename:"style.[contenthash].css",
            insert: "#css-anchor"
        } ),
        new HtmlWebpackPlugin({
            //hash: true,
            title: 'Flux Builder', 
            template: './index.html',
            filename: './index.html' 
        }),
        //new BundleAnalyzerPlugin()
   ],
    output: {
        filename: '[name].[contenthash].js',
        path: DESTINATION
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },
    externals : [
        {  
          "lodash": "_",
          "rxjs": "rxjs",
          "rxjs/operators": "window['rxjs']['operators']",
          "@youwol/cdn-client": "window['@youwol/cdn-client']",
          "@youwol/flux-core": "window['@youwol/flux-core']",
          "@youwol/flux-view": "window['@youwol/flux-view']",
          "@youwol/flux-files": "window['@youwol/flux-files']",
          "@youwol/fv-group": "window['@youwol/fv-group']",
          "@youwol/fv-input": "window['@youwol/fv-input']",
          "@youwol/fv-tree": "window['@youwol/fv-tree']",
          "@youwol/fv-tabs": "window['@youwol/fv-tabs']",
          "@youwol/fv-context-menu": "window['@youwol/fv-context-menu']",
          "@youwol/flux-youwol-essentials": "window['@youwol/flux-youwol-essentials']",
        }
      ],
    module: {
        rules: [
            /****************
            * PRE-LOADERS
            *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },

            /****************
            * LOADERS
            *****************/
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'ts-loader'
            }, 
            {
                test: /\.css$/i,
                use: [  MiniCssExtractPlugin.loader, 'css-loader' ]
            }
        ]
    },
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: path.resolve(__dirname, "./src"),
        historyApiFallback: true,
        inline: true,
        open: false,
        port:3001,
    }
};


