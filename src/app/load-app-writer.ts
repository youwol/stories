/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]] (open a story) or [[new$]] (create a new story).
 *
 * @module load-app
 */
import { launch$ } from './common'
import { AppState, AppView } from './app-writer/app-state'
import { render } from '@youwol/flux-view'

const container = document.getElementById('content')

launch$(true).subscribe(
    ({ story, globalContents, rootDocument, permissions }) => {
        const appState = new AppState({
            story,
            globalContents,
            rootDocument,
            permissions,
        })
        const appView = new AppView({ state: appState })
        container.appendChild(render(appView))
    },
)
