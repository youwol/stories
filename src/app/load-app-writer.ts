/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]] (open a story) or [[new$]] (create a new story).
 *
 * @module load-app
 */
import { Client } from '@youwol/cdn-client'
import { load$ } from './common/utils'
import { AppState, AppView } from './app-writer/app-state'
import { render } from '@youwol/flux-view'

const storyIdQueryParam = new URLSearchParams(window.location.search).get('id')
const container = document.getElementById('content')

const load = storyIdQueryParam
    ? load$(storyIdQueryParam, container, Client['initialLoadingScreen'])
    : load$('tmp-story', container, Client['initialLoadingScreen'])

load.subscribe(({ story, rootDocument, permissions }) => {
    const appState = new AppState({ story, rootDocument, permissions })
    const appView = new AppView({ state: appState })
    container.appendChild(render(appView))
})
