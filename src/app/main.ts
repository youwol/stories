/**
 * Entry point of the bundle, fetch the dependencies then await [[load-app]]
 *
 *
 * @module main
 */

import { Client, LoadingScreenView } from '@youwol/cdn-client'
import { setup } from '../auto-generated'
require('./style.css')
export {}

import * as cdnClient from '@youwol/cdn-client'

const searchParams = new URLSearchParams(window.location.search)

const loadingScreen = new LoadingScreenView()
loadingScreen.render()

if (searchParams.has('mode') && searchParams.get('mode') == 'reader') {
    await setup.installMainModule({
        cdnClient,
        installParameters: {
            css: [
                'bootstrap#4.4.1~bootstrap.min.css',
                'fontawesome#5.12.1~css/all.min.css',
                '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            ],
            onEvent: (ev) => {
                loadingScreen.next(ev)
            },
        },
    })
    Client['initialLoadingScreen'] = loadingScreen
    await import('./load-app-reader')
} else {
    await setup.installMainModule({
        cdnClient,
        installParameters: {
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
        },
    })
    Client['initialLoadingScreen'] = loadingScreen

    await import('./load-app-writer')
}
