import { Client } from './client/client';
import { StoryBackend } from './client/stories-backend';
import { load$ } from './main-app/app-state';

Client.service = new StoryBackend()

let storyId = new URLSearchParams(window.location.search).get("id")
load$(storyId, document.getElementById("content")).subscribe()
