/**
 * Entry point of the application after dependencies have been loaded (see [[main]]).
 * Essentially call [[load$]] (open a story) or [[new$]] (create a new story).
 *
 * @module load-app
 */
import { launch$ } from './common'
import { AppStateReader } from './app-reader/app-state'
import { AppView } from './app-reader/app-view'
import { render } from '@youwol/flux-view'

const container = document.getElementById('content')

launch$(false).subscribe(
    ({ story, rootDocument, globalContents, permissions }) => {
        const state = new AppStateReader({
            story,
            rootDocument,
            globalContents,
            permissions,
        })
        const appView = new AppView({ state })
        container.appendChild(render(appView))
    },
)
