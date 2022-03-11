import { getStylesSectors } from './manager-style'
import { getBlocks } from './manager-blocks'
import { getMiscBlocks } from './plugins/misc.blocks'
import * as grapesjs from 'grapesjs'
import { install } from '@youwol/cdn-client'
import { GrapesEditorState } from './grapes.state'

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
            styles: [],
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
            blocks: [...getBlocks(), ...getMiscBlocks()],
        },
        layerManager: { appendTo: layers },
        plugins: [
            /* plugin are loaded dynamically latter*/
        ],
        storageManager: { type: 'fake', autoload: false, autosave: false },
    }
}

export function installStartingCss(editor: grapesjs.Editor) {
    return install(
        {
            css: [
                'bootstrap#4.4.1~bootstrap.min.css',
                'fontawesome#5.12.1~css/all.min.css',
                '@youwol/fv-widgets#latest~dist/assets/styles/style.youwol.css',
            ],
        },
        {
            executingWindow: editor.Canvas.getWindow(),
        },
    )
}

export function postInitConfiguration(editor: grapesjs.Editor) {
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
}
