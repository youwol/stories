/**
 * Entry point of the bundle, fetch the dependencies then await [[load-app]]
 *
 *
 * @module main
 */

// (index.html is handled by HtmlWebpackPlugin)
import { install } from '@youwol/cdn-client'

require('./style.css')
export {}

await install(
    {
        modules: [
            'lodash',
            'rxjs',
            '@youwol/flux-core',
            '@youwol/flux-view',
            '@youwol/fv-group',
            '@youwol/fv-button',
            '@youwol/fv-tree',
            '@youwol/fv-tabs',
            '@youwol/fv-input',
            '@youwol/fv-context-menu',
            '@youwol/flux-fv-widgets',
            '@youwol/platform-essentials',
            'marked',
            'mathjax',
            'highlight.js',
        ],
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            'highlight.js#11.2.0~styles/default.min.css',
        ],
    },
    {
        displayLoadingScreen: true,
    },
)

await import('./load-app')
