/**
 * Things that may be considered
 *
 * To be able to inject custom code on action realization, e.g.:
 * ```
 *   editor.on('run:preview:before', ({ sender }: { sender }) => {
 *         // some client's code
 *   })
 *   editor.on('stop:preview:before', ({ sender }: { sender }) => {
 *         // some client's code
 *   })
 *  ```
 * Another example that is used in flux-builder:
 *  ```
 *  const defaultMove = editor.Commands.get('tlb-move')
 *  editor.Commands.add('tlb-move', {
 *     run(ed, sender, opts = {}) {
 *         // If the dedicated icon is used => opts['event'].target is not defined
 *         if (opts && opts['event'] && opts['event'].target) {
 *             return
 *         }
 *         defaultMove.run(ed, sender, opts)
 *         },
 *  })
 *  ```
 * @module grapes-editor.view
 */
import * as grapesjs from 'grapesjs'
import { combineLatest, Observable, Subject } from 'rxjs'
import { getStylesSectors } from './manager-style'
import { getBlocks } from './manager-blocks'
import { map, mergeMap } from 'rxjs/operators'

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
            scripts: [],
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
            blocks: getBlocks(),
        },
        layerManager: { appendTo: layers },
    }
}

export type DisplayMode = 'edit' | 'preview'
export type DeviceMode =
    | 'desktop'
    | 'tablet'
    | 'mobile-landscape'
    | 'mobile-portrait'

export const actionsFactory: Record<
    DisplayMode | DeviceMode,
    (editor: grapesjs.Editor) => void
> = {
    edit: (editor) => {
        editor.stopCommand('preview')
        editor.runCommand('sw-visibility')
    },
    preview: (editor) => {
        editor.stopCommand('sw-visibility')
        editor.runCommand('preview')
    },
    desktop: (editor) => {
        editor.setDevice('Desktop')
    },
    tablet: (editor) => {
        editor.setDevice('Tablet')
    },
    'mobile-landscape': (editor) => {
        editor.setDevice('Mobile landscape')
    },
    'mobile-portrait': (editor) => {
        editor.setDevice('Mobile portrait')
    },
}

export class GrapesEditorState {
    nativeEditor: grapesjs.Editor
    loadedNativeEditor$ = new Subject<grapesjs.Editor>()

    constructor() {
        localStorage.setItem('gjs-components', '')
        localStorage.setItem('gjs-html', '')
        localStorage.setItem('gjs-css', '')
        localStorage.setItem('gjs-styles', '')

        this.loadedNativeEditor$ = new Subject<grapesjs.Editor>()
    }

    load({
        canvas$,
        blocksPanel$,
        stylesPanel$,
        layersPanel$,
    }: {
        canvas$: Observable<HTMLDivElement>
        blocksPanel$: Observable<HTMLDivElement>
        stylesPanel$: Observable<HTMLDivElement>
        layersPanel$: Observable<HTMLDivElement>
    }) {
        combineLatest([canvas$, blocksPanel$, stylesPanel$, layersPanel$])
            .pipe(
                map(([canvas, blocks, style, layers]) =>
                    grapesConfig({ canvas, blocks, style, layers }),
                ),
                mergeMap((config) => this.load$(config)),
            )
            .subscribe((editor) => {
                editor.BlockManager.getCategories().each((ctg) =>
                    ctg.set('open', false),
                )
            })
    }

    load$(config: grapesjs.EditorConfig): Observable<grapesjs.Editor> {
        this.nativeEditor = grapesjs.init(config)

        const cssNodes = ['bootstrap', 'fa', 'fv'].map((idCss) => {
            const node = document.getElementById(idCss)
            if (idCss == null) {
                throw Error(`${idCss} css node not found`)
            }
            return node
        })

        this.nativeEditor.on('load', () => {
            const document = this.nativeEditor.Canvas.getDocument() as Document
            const headElement = document.head
            cssNodes.forEach((node) =>
                headElement.appendChild(node.cloneNode()),
            )
            this.loadedNativeEditor$.next(this.nativeEditor)
        })
        this.nativeEditor.SelectorManager.getAll().each((selector) => {
            //selector.set('private', privateClasses.includes(selector.id))
            selector.set('private', true)
        })

        this.nativeEditor.render()
        return this.loadedNativeEditor$
    }
}
