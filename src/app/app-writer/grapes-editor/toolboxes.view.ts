import { attr$, VirtualDOM } from '@youwol/flux-view'
import { GrapesEditorState } from './grapes.state'
import { AppState } from '../app-state'
import { map } from 'rxjs/operators'
import * as Dockable from '../../common/dockable-tabs/dockable-tabs.view'

interface Plugin {
    packageName: string
}

const availablePlugins: Plugin[] = [
    {
        packageName: '@youwol/grapes-text-editors',
    },
    {
        packageName: '@youwol/grapes-coding-playgrounds',
    },
    {
        packageName: '@youwol/grapes-basics',
    },
    {
        packageName: '@youwol/grapes-flux',
    },
]

export class ToolboxesTab extends Dockable.Tab {
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        super({
            id: 'plugins',
            title: 'Plugins',
            icon: 'fas fa-toolbox',
            content: () => {
                return {
                    class: 'w-100 h-100',
                    children: [
                        {
                            class: 'p-2',
                            children: availablePlugins.map((plugin) => {
                                return new PluginView({
                                    plugin,
                                    state: params.state.appState,
                                })
                            }),
                        },
                    ],
                }
            },
        })
    }
}

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
                innerText: this.plugin.packageName,
            },
        ]
    }
}
