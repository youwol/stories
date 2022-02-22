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
import {
    BehaviorSubject,
    combineLatest,
    merge,
    Observable,
    Subject,
} from 'rxjs'
import { getStylesSectors } from './manager-style'
import { getBlocks } from './manager-blocks'
import { filter, map, mergeMap } from 'rxjs/operators'
import { Page } from '../models'
import { getMiscBlocks } from './plugins/misc.blocks'
import { markdownComponent } from './plugins/markdown/mardown.component'
import { mathjaxComponent } from './plugins/mathjax/mathjax.component'
import { fluxAppComponent } from './plugins/flux-app/flux-app.component'
import { customViewComponent } from './plugins/custom-view/custom-view.component'
import { npmPackageComponent } from './plugins/npm-package/npm-package.component'
import { fluxModuleSettingsComponent } from './plugins/flux-module-settings/flux-module-settings.component'

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
            markdownComponent,
            mathjaxComponent,
            fluxAppComponent,
            customViewComponent,
            npmPackageComponent,
            fluxModuleSettingsComponent,
            jsPlaygroundComponent,
        ],
    }
}

export type DisplayMode = 'edit' | 'preview'
export type DeviceMode =
    | 'desktop'
    | 'tablet'
    | 'mobile-landscape'
    | 'mobile-portrait'

export type EditorMode = 'blocks' | 'styles' | 'layers'

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
    static privateClasses: string[] = []
    nativeEditor: grapesjs.Editor
    loadedNativeEditor$ = new Subject<grapesjs.Editor>()

    public readonly displayMode$ = new BehaviorSubject<DisplayMode>('edit')
    public readonly deviceMode$ = new BehaviorSubject<DeviceMode>('desktop')

    public readonly page$: BehaviorSubject<Page>

    public readonly subscriptions = []

    private cachedHTML = ''
    private cachedCSS = ''

    constructor(params: { page$: BehaviorSubject<Page> }) {
        Object.assign(this, params)

        localStorage.setItem('gjs-components', '')
        localStorage.setItem('gjs-html', '')
        localStorage.setItem('gjs-css', '')
        localStorage.setItem('gjs-styles', '')

        this.loadedNativeEditor$ = new Subject<grapesjs.Editor>()

        this.subscriptions = [
            this.connectActions(),
            ...this.connectRenderingUpdates(),
        ]
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
            if (node == null) {
                throw Error(`${idCss} css node not found`)
            }
            return node
        })
        const jsNodes = [].map((idJs) => {
            const node = document.getElementById(idJs)
            if (node == null) {
                throw Error(`${idJs} script node not found`)
            }
            return node
        })
        this.nativeEditor.on('load', () => {
            const document = this.nativeEditor.Canvas.getDocument() as Document
            const headElement = document.head
            cssNodes.forEach((node) =>
                headElement.appendChild(node.cloneNode()),
            )
            jsNodes.forEach((node: HTMLScriptElement) => {
                const script = document.createElement('script')
                script.src = node.src
                script.id = node.id
                script.async = true
                script.onload = () => {
                    window['cdn'] = window['@youwol/cdn-client']
                }
                headElement.appendChild(script)
            })
            this.loadedNativeEditor$.next(this.nativeEditor)
        })
        this.nativeEditor.SelectorManager.getAll().each((selector) => {
            selector.set(
                'private',
                GrapesEditorState.privateClasses.includes(selector.id),
            )
        })
        this.nativeEditor.on('selector:add', (selector) => {
            selector.set('active', false)
            selector.set(
                'private',
                GrapesEditorState.privateClasses.includes(selector.id),
            )
        })

        this.nativeEditor.render()
        return this.loadedNativeEditor$
    }

    connectActions() {
        const mode$ = merge(this.displayMode$, this.deviceMode$)
        return this.loadedNativeEditor$
            .pipe(
                mergeMap((editor) => {
                    return mode$.pipe(map((mode) => ({ editor, mode })))
                }),
            )
            .subscribe(({ editor, mode }) => {
                actionsFactory[mode](editor)
            })
    }

    connectRenderingUpdates() {
        const sub0 = combineLatest([
            this.loadedNativeEditor$,
            this.page$.pipe(filter((page) => page != undefined)),
        ]).subscribe(([editor, { content }]) => {
            if (content.html != this.cachedHTML) {
                this.cachedHTML = content.html
                editor.setComponents(content.html)
            }
            if (content.css != this.cachedCSS) {
                this.cachedCSS = content.css
                editor.setStyle(content.css)
            }
        })

        const sub1 = this.loadedNativeEditor$.subscribe((editor) => {
            editor.on('change', () => {
                const html = localStorage.getItem('gjs-html')
                let needUpdate = false
                if (html != this.cachedHTML && html != '') {
                    this.cachedHTML = html
                    needUpdate = true
                }
                const css = cleanCss(localStorage.getItem('gjs-css'))
                if (css != this.cachedCSS && css != '') {
                    this.cachedCSS = css
                    needUpdate = true
                }
                if (needUpdate) {
                    const document = this.page$.getValue().document

                    this.page$.next({
                        document,
                        content: { html, css },
                        originId: 'editor',
                    })
                }
            })
        })
        return [sub0, sub1]
    }
}

function cleanCss(css: string): string {
    const rules = [...new Set(css.split('}'))]
        .filter((r) => r.length > 0)
        .map((r) => r + '}')
    return rules.reduce((acc: string, e: string) => acc + e, '')
}
