/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]] (open a story) or [[new$]] (create a new story).
 *
 * @module load-app
 */
import { Client } from '@youwol/cdn-client'
import { load$ } from './common'
import { AppStateReader } from './app-reader/app-state'
import { AppView } from './app-reader/app-view'
import { render } from '@youwol/flux-view'

const storyIdQueryParam = new URLSearchParams(window.location.search).get('id')
const container = document.getElementById('content')

load$(
    storyIdQueryParam,
    container,
    Client['initialLoadingScreen'],
    false,
).subscribe(({ story, rootDocument, globalContents, permissions }) => {
    const state = new AppStateReader({
        story,
        rootDocument,
        globalContents,
        permissions,
    })
    const appView = new AppView({ state })
    container.appendChild(render(appView))
})

/*
storyIdQueryParam
    ? load$(
        storyIdQueryParam,
        container,
        Client['initialLoadingScreen'],
    ).subscribe()
    : load$('tmp-story', container, Client['initialLoadingScreen']).subscribe() //new$(container, Client['initialLoadingScreen']).subscribe()
*/
