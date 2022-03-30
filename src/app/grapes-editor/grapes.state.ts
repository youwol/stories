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

import { distinctUntilChanged, map, mergeMap, skip, take } from 'rxjs/operators'
import { AppState } from '../main-app/app-state'
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
    public readonly storage: StorageManager

    public readonly installedPlugins: {
        [packName: string]: { blocks: string[]; components: string[] }
    } = {}

    nativeEditor: grapesjs.Editor
    public readonly loadedNativeEditor$ = new ReplaySubject<grapesjs.Editor>(1)

    public readonly displayMode$ = new BehaviorSubject<DisplayMode>('edit')
    public readonly deviceMode$ = new BehaviorSubject<DeviceMode>('desktop')

    public readonly subscriptions = []

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)

        this.storage = new StorageManager({ appState: this.appState })
        this.subscriptions = [this.connectActions()]
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
                // No op for now
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
                mergeMap(([config, plugins]) => {
                    this.nativeEditor = grapesjs.init(config)
                    this.synchronizePlugins(plugins, this.nativeEditor)
                    this.nativeEditor.StorageManager.add(
                        StorageManager.type,
                        this.storage,
                    )
                    postInitConfiguration(this.nativeEditor, this.appState)
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
            const { blocks, components } = this.installedPlugins[pluginName]
            blocks.forEach((block) => {
                this.nativeEditor.BlockManager.remove(block)
            })
            components.forEach((component) => {
                this.nativeEditor.DomComponents.removeType(component)
            })
            delete this.installedPlugins[pluginName]
        })
    }
}
