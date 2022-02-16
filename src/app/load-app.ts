/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]].
 *
 *
 * @module load-app
 */
import { Client } from '@youwol/cdn-client'
import { load$, new$ } from './main-app/utils'

const storyIdQueryParam = new URLSearchParams(window.location.search).get('id')
const container = document.getElementById('content')

Client.service = new StoryBackend()

const storyId = new URLSearchParams(window.location.search).get('id')
load$(storyId, document.getElementById('content')).subscribe()
