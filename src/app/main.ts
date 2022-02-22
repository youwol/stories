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

const modules = [
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
].map((name) => ({
    name,
    version: 'latest',
    domId: name,
}))

await install(
    {
        modules,
        css: [
            {
                resource: 'bootstrap#4.4.1~bootstrap.min.css',
                domId: 'bootstrap',
            },
            {
                resource: 'fontawesome#5.12.1~css/all.min.css',
                domId: 'fa',
            },
            {
                resource:
                    '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
                domId: 'fv',
            },
            {
                resource: 'highlight.js#11.2.0~styles/default.min.css',
                domId: 'highlight',
            },
            {
                resource: 'grapes#latest~css/grapes.min.css',
                domId: 'grapes-css',
            },
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
