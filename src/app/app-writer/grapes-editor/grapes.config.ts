import { getStylesSectors } from './manager-style'
import grapesjs from 'grapesjs'
import { install } from '@youwol/cdn-client'
import { GrapesEditorState } from './grapes.state'
import { AppState } from '../app-state'
import { StorageManager } from './grapes.storage'
import { from, Observable } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
/**
 *
 * @param canvas
 * @param blocks
 * @param style
 * @param layers
 * @category Configuration
 */
export function grapesConfig({
    canvas,
    blocks,
    style,
    layers,
}: {
    canvas: HTMLDivElement
    blocks: HTMLDivElement
    style: HTMLDivElement
    layers: HTMLDivElement
}): grapesjs.EditorConfig {
    return {
        autorender: false,
        container: canvas,
        canvas: {
            styles: [
                // styles are not included here as grapesjs does not wait for them to be parsed before rendering a page
                // for now see {@link installStartingCss}
            ],
            scripts: [
                '/api/assets-gateway/raw/package/QHlvdXdvbC9jZG4tY2xpZW50/latest/dist/@youwol/cdn-client.js',
            ],
        },
        height: '100%',
        width: 'auto',
        panels: { defaults: [] },
        assetManager: {
            assets: [],
            autoAdd: true,
        },
        commands: {
            defaults: [],
        },
        selectorManager: {
            appendTo: style,
        },
        traitManager: { appendTo: style },
        styleManager: {
            appendTo: style,
            sectors: getStylesSectors(),
        },
        blockManager: {
            appendTo: blocks,
            blocks: [],
        },
        layerManager: { appendTo: layers },
        plugins: [
            /* plugin are loaded dynamically latter*/
        ],
        storageManager: {
            type: StorageManager.type,
            autosave: true, // Store data automatically
            autoload: false, // Pages loading are handled manually
            stepsBeforeSave: 1,
        },
    }
}

export function installStartingCss() {
    return (obs: Observable<grapesjs.Editor>) => {
        return obs.pipe(
            mergeMap((editor) =>
                from(
                    install({
                        css: [
                            'bootstrap#4.4.1~bootstrap.min.css',
                            'fontawesome#5.12.1~css/all.min.css',
                            '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
                        ],
                        executingWindow: editor.Canvas.getWindow(),
                    }),
                ).pipe(map(() => editor)),
            ),
        )
    }
}

export function postInitConfiguration(
    editor: grapesjs.Editor,
    appState: AppState,
) {
    editor.SelectorManager.getAll().each((selector) => {
        selector.set(
            'private',
            GrapesEditorState.privateClasses.includes(selector.id),
        )
    })
    editor.on('selector:add', (selector) => {
        selector.set('active', false)
        selector.set(
            'private',
            GrapesEditorState.privateClasses.includes(selector.id),
        )
    })
    editor.on('component:deselected', () => {
        appState.removeCodeEditor()
    })
}
