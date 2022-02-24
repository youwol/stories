/**
 * Entry point of the bundle, fetch the dependencies then await [[load-app]]
 *
 *
 * @module main
 */

import { Client, install, LoadingScreenView } from '@youwol/cdn-client'

require('./style.css')
export {}

const loadingScreen = new LoadingScreenView({
    container: document.body,
    mode: 'svg',
})
loadingScreen.render()

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
            'grapes',
        ],
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            'highlight.js#11.2.0~styles/default.min.css',
            'grapes#latest~css/grapes.min.css',
        ],
    },
    {
        onEvent: (ev) => {
            loadingScreen.next(ev)
        },
    },
)
Client['initialLoadingScreen'] = loadingScreen

await import('./load-app')
