import { attr$, VirtualDOM } from '@youwol/flux-view'
import { EditorMode, GrapesEditorState } from './grapes.state'
import { Subject } from 'rxjs'
import { AttributesPanel } from './utils.view'
import { AppState } from '../main-app/app-state'
import { map } from 'rxjs/operators'

interface Plugin {
    packageName: string
    displayName: string
}

const availablePlugins: Plugin[] = [
    {
        packageName: '@youwol/grapes-js-playground',
        displayName: 'Js playground',
    },
    {
        packageName: '@youwol/grapes-editors',
        displayName: 'Advanced Editors',
    },
    {
        packageName: '@youwol/grapes-flux',
        displayName: 'Flux',
    },
    {
        packageName: '@youwol/grapes-custom-view',
        displayName: 'Custom View',
    },
]

export class PluginView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]
    public readonly plugin: Plugin
    public readonly state: AppState
    public readonly onclick = () => {
        this.state.togglePlugin(this.plugin.packageName)
    }

    constructor(params: { plugin: Plugin; state: AppState }) {
        Object.assign(this, params)
        this.children = [
            {
                class: attr$(
                    this.state.plugins$.pipe(
                        map((plugins) =>
                            plugins.find(
                                (plugin) => plugin == this.plugin.packageName,
                            ),
                        ),
                    ),
                    (enabled) =>
                        enabled ? 'fas fa-check-square' : 'fas fa-square',
                ),
            },
            {
                class: 'px-2',
                innerText: this.plugin.displayName,
            },
        ]
    }
}

export class ToolboxesPanel extends AttributesPanel {
    public readonly children: VirtualDOM[]

    constructor(params: {
        target: EditorMode
        editorMode$: Subject<EditorMode>
        state: GrapesEditorState
    }) {
        super(params)
        this.children = [
            {
                class: 'p-2',
                children: availablePlugins.map((plugin) => {
                    return new PluginView({
                        plugin,
                        state: this.state.appState,
                    })
                }),
            },
        ]
    }
}