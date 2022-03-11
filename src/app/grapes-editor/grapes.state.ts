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
    ReplaySubject,
} from 'rxjs'

import { filter, map, mergeMap } from 'rxjs/operators'
import { Page } from '../models'
import { AppState } from '../main-app/app-state'
import {
    grapesConfig,
    installStartingCss,
    postInitConfiguration,
} from './grapes.config'

export type DisplayMode = 'edit' | 'preview'
export type DeviceMode =
    | 'desktop'
    | 'tablet'
    | 'mobile-landscape'
    | 'mobile-portrait'

export type EditorMode = 'blocks' | 'styles' | 'layers' | 'toolbox'

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

    public readonly appState: AppState
    public readonly plugins: string[]

    nativeEditor: grapesjs.Editor
    loadedNativeEditor$ = new ReplaySubject<grapesjs.Editor>(1)

    public readonly displayMode$ = new BehaviorSubject<DisplayMode>('edit')
    public readonly deviceMode$ = new BehaviorSubject<DeviceMode>('desktop')

    public readonly page$: BehaviorSubject<Page>

    public readonly subscriptions = []

    private cachedHTML = ''
    private cachedCSS = ''

    constructor(params: { page$: BehaviorSubject<Page>; appState: AppState }) {
        Object.assign(this, params)

        this.subscriptions = [
            this.connectActions(),
            ...this.connectRenderingUpdates(),
        ]
        combineLatest([
            this.loadedNativeEditor$,
            this.appState.plugins$,
        ]).subscribe(([editor, plugins]) => {
            plugins.forEach((packageName) => {
                const plugin = window[packageName] as unknown as {
                    addComponents: any
                    addBlocks: any
                }
                plugin.addComponents(editor)
                plugin.addBlocks(editor)
            })
        })
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
                mergeMap((config) => {
                    this.nativeEditor = grapesjs.init(config)
                    postInitConfiguration(this.nativeEditor)
                    this.nativeEditor.on('component:deselected', () => {
                        this.appState.removeCodeEditor()
                    })
                    this.nativeEditor.render()
                    this.nativeEditor.on('load', () => {
                        installStartingCss(this.nativeEditor).then(() => {
                            this.loadedNativeEditor$.next(this.nativeEditor)
                        })
                    })
                    return this.loadedNativeEditor$
                }),
            )
            .subscribe(() => {
                /*no op*/
            })
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
                const html = editor.getHtml()
                let needUpdate = false
                if (html != this.cachedHTML && html != '') {
                    this.cachedHTML = html
                    needUpdate = true
                }
                const css = cleanCss(editor.getCss())
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
