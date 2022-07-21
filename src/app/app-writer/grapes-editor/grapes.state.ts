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
    from,
    merge,
    Observable,
    ReplaySubject,
} from 'rxjs'

import {
    distinctUntilChanged,
    map,
    mergeMap,
    skip,
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
    public readonly installedPlugins: {
        [packName: string]: { blocks: string[]; components: string[] }
    } = {}

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
     * @group Immutable Constants
     */
    public readonly subscriptions = []

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)

        this.storage = new StorageManager({ appState: this.appState })
        this.subscriptions = [
            this.connectActions(),
            ...this.connectEnvGlobals(),
        ]
        combineLatest([
            this.loadedNativeEditor$,
            this.appState.selectedNode$.pipe(
                distinctUntilChanged((node1, node2) => node1.id == node2.id),
            ),
        ]).subscribe(([editor]) => {
            editor.DomComponents.clear() // Clear components
            editor.CssComposer.clear() // Clear styles
            editor.UndoManager.clear()
            editor.load(() => {
                // Select the root component
                editor.select(editor.getComponents().at(0))
            })
        })

        combineLatest([
            this.loadedNativeEditor$,
            this.appState.plugins$.pipe(skip(1)),
        ]).subscribe(([editor, plugins]) => {
            this.synchronizePlugins(plugins, editor)
            editor.load(() => {
                // No op for now
            })
        })
        combineLatest([
            this.loadedNativeEditor$,
            this.appState.dispositionChanged$,
        ]).subscribe(([editor]) => {
            editor.refresh()
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
        combineLatest([
            canvas$,
            blocksPanel$,
            stylesPanel$,
            layersPanel$,
            // We should not need to wait for plugins to load has their scripts are encapsulated in html
            this.appState.plugins$.pipe(take(1)),
        ])
            .pipe(
                map(([canvas, blocks, style, layers, plugins]) => {
                    return [
                        grapesConfig({ canvas, blocks, style, layers }),
                        plugins,
                    ]
                }),
                map(([config, plugins]) => {
                    this.nativeEditor = grapesjs.init(config)
                    this.nativeEditor.Components.addType('root', {})
                    this.synchronizePlugins(plugins, this.nativeEditor)
                    this.nativeEditor.StorageManager.add(
                        StorageManager.type,
                        this.storage,
                    )
                    this.nativeEditor.render()
                    return this.nativeEditor
                }),
                resolveGlobals(this.appState),
                mergeMap((editor) => {
                    postInitConfiguration(editor, this.appState)
                    editor.on('load', () => {
                        installStartingCss(editor).then(() => {
                            this.loadedNativeEditor$.next(editor)
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

    connectEnvGlobals() {
        const subCss = combineLatest([
            this.loadedNativeEditor$,
            this.appState.globalCss$.pipe(skip(1)),
        ]).subscribe(([editor, css]) => {
            const head = editor.Canvas.getDocument().head
            let styleElem = head.querySelector('style#global-css')
            styleElem.innerHTML = css
        })
        const subJs = combineLatest([
            this.loadedNativeEditor$,
            this.appState.globalJavascript$.pipe(skip(1)),
        ])
            .pipe(
                mergeMap(([editor, js]) => {
                    const promise = new Function(js)()(
                        editor.Canvas.getWindow(),
                    )
                    return from(promise).pipe(map((data) => [editor, data]))
                }),
            )
            .subscribe(([editor, data]) => {
                editor.Canvas.getWindow().globalJavascript = data
            })
        const subComponents = combineLatest([
            this.loadedNativeEditor$,
            this.appState.globalComponents$.pipe(skip(1)),
        ])
            .pipe(
                mergeMap(([editor, js]) => {
                    const promise = new Function(js)()(window)
                    return from(promise).pipe(map((data) => [editor, data]))
                }),
            )
            .subscribe(([editor, data]) => {
                window['globalPlugin'] = data
                this.uninstallPlugin('globalPlugin')
                this.synchronizePlugins(
                    [...Object.keys(this.installedPlugins), 'globalPlugin'],
                    editor,
                )
            })

        return [subCss, subJs, subComponents]
    }

    synchronizePlugins(plugins: string[], _editor: grapesjs.Editor) {
        const installedPluginsName = Object.keys(this.installedPlugins)
        const pluginsToAdd = plugins.filter(
            (candidate) => !installedPluginsName.includes(candidate),
        )
        const pluginsToRemove = installedPluginsName.filter(
            (candidate) => !plugins.includes(candidate),
        )

        pluginsToAdd.forEach((pluginName) => {
            const plugin = window[pluginName] as unknown as {
                getComponents
                getBlocks
            }
            const input = {
                appState: this.appState,
                grapesEditor: this.nativeEditor,
                idFactory: (name) => `${pluginName}#${name}`,
            }
            let components = []
            plugin.getComponents().forEach((ComponentClass) => {
                let component = new ComponentClass(input)
                this.nativeEditor.DomComponents.addType(
                    component.componentType,
                    component,
                )
                components.push(component.componentType)
            })
            let blocks = []
            plugin.getBlocks().forEach((BlockClass) => {
                let block = new BlockClass(input)
                this.nativeEditor.BlockManager.add(block.blockType, {
                    ...block,
                    category: {
                        id: pluginName,
                        label: pluginName,
                        open: false,
                    },
                })
                blocks.push(block.blockType)
            })
            this.installedPlugins[pluginName] = { components, blocks }
        })
        pluginsToRemove.forEach((pluginName) => {
            this.uninstallPlugin(pluginName)
        })
    }

    private uninstallPlugin(pluginName) {
        if (!this.installedPlugins[pluginName]) return
        const { blocks, components } = this.installedPlugins[pluginName]
        blocks.forEach((block) => {
            this.nativeEditor.BlockManager.remove(block)
        })
        components.forEach((component) => {
            this.nativeEditor.DomComponents.removeType(component)
        })
        delete this.installedPlugins[pluginName]
    }
}

function resolveGlobals(appState: AppState) {
    const evaluate = (content, editor) => {
        return from(new Function(content)()(editor.Canvas.getWindow()))
    }
    return (source$: Observable<grapesjs.Editor>) => {
        return source$.pipe(
            mergeMap((editor) =>
                combineLatest([
                    appState.globalJavascript$.pipe(
                        take(1),
                        mergeMap((js) => evaluate(js, editor)),
                    ),
                    appState.globalComponents$.pipe(
                        take(1),
                        mergeMap((js) => evaluate(js, editor)),
                    ),
                    appState.globalCss$.pipe(take(1)),
                ]).pipe(map((globals) => [editor, ...globals])),
            ),
            tap(([editor, globalJsData, globalComponents, globalCss]) => {
                const head = editor.Canvas.getDocument().head
                const styleElem = document.createElement('style')
                styleElem.id = 'global-css'
                styleElem.innerHTML = globalCss
                head.appendChild(styleElem)
                editor.Canvas.getWindow().globalJavascript = globalJsData
                console.log(globalComponents)
            }),
            map(([editor]) => editor),
        )
    }
}
