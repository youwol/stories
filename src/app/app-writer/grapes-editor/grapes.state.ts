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
import grapesjs from 'grapesjs'
import {
    BehaviorSubject,
    combineLatest,
    from,
    merge,
    Observable,
    ReplaySubject,
} from 'rxjs'

import {
    distinctUntilChanged,
    map,
    mergeMap,
    shareReplay,
    skip,
    switchMap,
    take,
    tap,
} from 'rxjs/operators'
import { AppState } from '../app-state'
import { StorageManager } from './grapes.storage'
import {
    grapesConfig,
    installStartingCss,
    postInitConfiguration,
} from './grapes.config'
import { PluginsStore, synchronizePlugins } from './grapes.plugins'

export type DisplayMode = 'edit' | 'preview'
export type DeviceMode =
    | 'desktop'
    | 'tablet'
    | 'mobile-landscape'
    | 'mobile-portrait'

export type EditorMode = 'blocks' | 'styles' | 'layers' | 'toolbox'

/**
 * @category Factory
 */
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

/**
 * @category State
 */
export class GrapesEditorState {
    static privateClasses: string[] = []

    /**
     * @group States
     */
    public readonly appState: AppState
    /**
     * @group HTTP
     */
    public readonly storage: StorageManager

    /**
     * @group Mutable
     */
    public readonly installedPlugins: PluginsStore = {}

    /**
     * @group State
     */
    nativeEditor: grapesjs.Editor

    /**
     * @group Observables
     */
    public readonly loadedNativeEditor$ = new ReplaySubject<grapesjs.Editor>(1)

    /**
     * @group Observables
     */
    public readonly displayMode$ = new BehaviorSubject<DisplayMode>('edit')

    /**
     * @group Observables
     */
    public readonly deviceMode$ = new BehaviorSubject<DeviceMode>('desktop')

    /**
     * @group Observables
     */
    public readonly selectedTab$ = new BehaviorSubject<string>('blocks')

    /**
     * @group Observables
     */
    public readonly ready$: Observable<unknown>

    /**
     * @group Immutable Constants
     */
    public readonly subscriptions = []

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)

        this.storage = new StorageManager({ appState: this.appState })
        this.subscriptions = [this.connectActions()]
        const pageLoaded$ = combineLatest([
            this.loadedNativeEditor$,
            this.appState.selectedNode$.pipe(
                distinctUntilChanged((node1, node2) => node1.id == node2.id),
            ),
        ]).pipe(
            map(([editor]) => editor),
            loadPage(this.appState),
            shareReplay({ bufferSize: 1, refCount: true }),
        )
        pageLoaded$.subscribe()
        this.ready$ = pageLoaded$.pipe(take(1))
        combineLatest([
            this.loadedNativeEditor$,
            this.appState.plugins$,
            this.appState.globalComponents$,
        ])
            .pipe(skip(1), syncPlugins(this.appState))
            .subscribe()

        combineLatest([
            this.loadedNativeEditor$,
            this.appState.dispositionChanged$,
        ]).subscribe(([editor]) => {
            editor.refresh()
        })
    }

    initializeGrapesEditor({
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
        combineLatest([
            canvas$,
            blocksPanel$,
            stylesPanel$,
            layersPanel$,
            this.appState.plugins$,
            this.appState.globalComponents$,
        ])
            .pipe(
                take(1),
                map(
                    ([
                        canvas,
                        blocks,
                        style,
                        layers,
                        plugins,
                        globalComponents,
                    ]) => {
                        return [
                            grapesConfig({ canvas, blocks, style, layers }),
                            plugins,
                            globalComponents,
                        ]
                    },
                ),
                map(([config, plugins, globalComponents]) => {
                    this.nativeEditor = grapesjs.init(
                        config as grapesjs.EditorConfig,
                    )
                    this.nativeEditor.Components.addType('root', {})
                    this.nativeEditor.StorageManager.add(
                        StorageManager.type,
                        this.storage,
                    )
                    return [this.nativeEditor, plugins, globalComponents]
                }),
                syncPlugins(this.appState),
                tap((editor) => {
                    postInitConfiguration(editor, this.appState)
                    this.nativeEditor.render()
                    editor.on('load', () => {
                        this.loadedNativeEditor$.next(editor)
                    })
                }),
            )
            .subscribe()
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
}

function evaluateScript(content, nativeEditor) {
    return from(new Function(content)()(nativeEditor.Canvas.getWindow()))
}

function syncPlugins(appState: AppState) {
    return (source$: Observable<[grapesjs.Editor, string[], string]>) => {
        return source$.pipe(
            switchMap(([nativeEditor, plugins, globalComponents]) => {
                return evaluateScript(globalComponents, nativeEditor).pipe(
                    tap((globalPlugin) =>
                        synchronizePlugins(
                            appState,
                            nativeEditor,
                            plugins,
                            globalPlugin,
                        ),
                    ),
                    map(() => nativeEditor),
                )
            }),
        )
    }
}

function installGlobalJsCss(appState: AppState) {
    return (source$: Observable<grapesjs.Editor>) => {
        return source$.pipe(
            switchMap((nativeEditor) =>
                combineLatest([
                    appState.globalJavascript$.pipe(
                        mergeMap((js) => evaluateScript(js, nativeEditor)),
                    ),
                    appState.globalCss$,
                ]).pipe(map((globals) => [nativeEditor, ...globals])),
            ),
            tap(
                ([editor, globalJsData, globalCss]: [
                    grapesjs.Editor,
                    unknown,
                    string,
                ]) => {
                    const head = editor.Canvas.getDocument().head
                    const styleElem = document.createElement('style')
                    styleElem.id = 'global-css'
                    styleElem.innerHTML = globalCss
                    head.appendChild(styleElem)
                    editor.Canvas.getWindow()['globalJavascript'] = globalJsData
                },
            ),
            map(([editor]) => editor),
        )
    }
}

function loadPage(appState: AppState) {
    return (source$: Observable<grapesjs.Editor>) => {
        return source$.pipe(
            tap((editor) => {
                editor.StorageManager.setAutosave(false)
                editor.DomComponents.clear() // Clear components
                editor.CssComposer.clear() // Clear styles
                editor.UndoManager.clear()
            }),
            mergeMap((editor: grapesjs.Editor) =>
                from(editor.load({}).then(() => editor)),
            ),
            installStartingCss(),
            tap((editor) => {
                editor.StorageManager.setAutosave(true)
            }),
            // the following observable emit each time CSS or JS globals are modified
            installGlobalJsCss(appState),
        )
    }
}
