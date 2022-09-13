/**
 * Entry point of the bundle, fetch the dependencies then await [[load-app]]
 *
 *
 * @module main
 */

import { Client, install, LoadingScreenView } from '@youwol/cdn-client'
import { setup } from '../auto-generated'
require('./style.css')
export {}

const searchParams = new URLSearchParams(window.location.search)

const loadingScreen = new LoadingScreenView()
loadingScreen.render()

if (searchParams.has('mode') && searchParams.get('mode') == 'reader') {
    const required = ['@youwol/fv-tree', '@youwol/os-top-banner' ]
    await install({
        modules: Object.entries(setup.runTimeDependencies.load).filter(([k])=> required.includes(k)).map(
            ([k, v]) => `${k}#${v}`,
        ),
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
    const required = [
        '@youwol/fv-tree',
        '@youwol/os-top-banner',
        '@youwol/fv-group',
        '@youwol/fv-button',
        '@youwol/fv-tree',
        '@youwol/fv-tabs',
        '@youwol/fv-input',
        '@youwol/fv-context-menu',
        '@youwol/os-top-banner',
        'grapesjs'
    ]
    await install({
        modules: Object.entries(setup.runTimeDependencies.load).filter(([k])=> required.includes(k)).map(
            ([k, v]) => `${k}#${v}`,
        ),
        css: [
            'bootstrap#4.4.1~bootstrap.min.css',
            'fontawesome#5.12.1~css/all.min.css',
            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            'highlight.js#11.2.0~styles/default.css',
            'grapesjs#0.18.3~css/grapes.min.css',
        ],
        onEvent: (ev) => {
            loadingScreen.next(ev)
        },
    })
    Client['initialLoadingScreen'] = loadingScreen

    await import('./load-app-writer')
}
