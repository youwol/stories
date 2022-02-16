/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]] (open a story) or [[new$]] (create a new story).
 *
 * @module load-app
 */
import { Client } from '@youwol/cdn-client'
import { load$, new$ } from './main-app/utils'

const storyIdQueryParam = new URLSearchParams(window.location.search).get('id')
const container = document.getElementById('content')

storyIdQueryParam
    ? load$(
          storyIdQueryParam,
          container,
          Client['initialLoadingScreen'],
      ).subscribe()
    : new$(container, Client['initialLoadingScreen']).subscribe()
