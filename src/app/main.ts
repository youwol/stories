/**
 * Entry point of the bundle, fetch the dependencies then await [[load-app]]
 *
 *
 * @module main
 */

import { Client, install, LoadingScreenView } from '@youwol/cdn-client'

require('./style.css')
export {}

const searchParams = new URLSearchParams(window.location.search)

const loadingScreen = new LoadingScreenView()
loadingScreen.render()

if (searchParams.has('mode') && searchParams.get('mode') == 'reader') {
    await install({
        modules: [
            { name: '@youwol/fv-tree', version: '0.x' },
            { name: '@youwol/os-top-banner', version: '0.x' },
        ],
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
        ],
        onEvent: (ev) => {
            loadingScreen.next(ev)
        },
    })

    Client['initialLoadingScreen'] = loadingScreen
    await import('./load-app-reader')
} else {
    await install({
        modules: [
            '@youwol/fv-group#0.x',
            '@youwol/fv-button#0.x',
            '@youwol/fv-tree#0.x',
            '@youwol/fv-tabs#0.x',
            '@youwol/fv-input#0.x',
            '@youwol/fv-context-menu#0.x',
            '@youwol/os-top-banner#0.x',
            'grapes#0.x',
        ],
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            'highlight.js#11.2.0~styles/default.min.css',
            'grapes#latest~css/grapes.min.css',
        ],
        onEvent: (ev) => {
            loadingScreen.next(ev)
        },
    })
    Client['initialLoadingScreen'] = loadingScreen

    await import('./load-app-writer')
}
