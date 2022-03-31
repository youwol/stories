/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]] (open a story) or [[new$]] (create a new story).
 *
 * @module load-app
 */
import { Client } from '@youwol/cdn-client'
import { load$ } from './common'

const storyIdQueryParam = new URLSearchParams(window.location.search).get('id')
const container = document.getElementById('content')

load$(storyIdQueryParam, container, Client['initialLoadingScreen']).subscribe(
    ({ story, rootDocument, permissions }) => {
        console.log({ story, rootDocument, permissions })
    },
)

/*
storyIdQueryParam
    ? load$(
        storyIdQueryParam,
        container,
        Client['initialLoadingScreen'],
    ).subscribe()
    : load$('tmp-story', container, Client['initialLoadingScreen']).subscribe() //new$(container, Client['initialLoadingScreen']).subscribe()
*/
