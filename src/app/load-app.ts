/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]].
 * 
 * 
 * @module load-app
 */


import { Client } from './client/client';
import { StoryBackend } from './client/stories-backend';
import { load$ } from './main-app/app-state';

Client.service = new StoryBackend()

let storyId = new URLSearchParams(window.location.search).get("id")
load$(storyId, document.getElementById("content")).subscribe()
