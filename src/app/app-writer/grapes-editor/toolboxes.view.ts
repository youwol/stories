import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import { GrapesEditorState } from './grapes.state'
import { AppState } from '../app-state'
import { map } from 'rxjs/operators'
import * as Dockable from '../../common/dockable-tabs/dockable-tabs.view'
import { Installer, ChildApplicationAPI } from '@youwol/os-core'

interface Plugin {
    packageName: string
}

export class ToolboxesTab extends Dockable.Tab {
    public readonly children: VirtualDOM[]

    constructor(params: { state: GrapesEditorState }) {
        super({
            id: 'plugins',
            title: 'Plugins',
            icon: 'fas fa-toolbox',
            content: () => {
                return {
                    class: 'w-100 h-100 d-flex flex-column px-2',
                    children: [
                        new TitleView(),
                        new HintView(),
                        new PluginsListView(params),
                    ],
                }
            },
        })
    }
}

class TitleView implements VirtualDOM {
    public readonly class = ' text-center my-2'
    public readonly innerText = 'Plugins'
    public readonly style = {
        fontSize: 'x-large',
        fontWeight: 'bold',
    }
}

class HintView implements VirtualDOM {
    static docUrl =
        '/applications/@youwol/stories/latest?id=5f48f380-9f0b-4854-ad7a-788d70c1ce6b&mode=reader'
    public readonly class = ' text-justify my-1 px-2'
    public readonly children: VirtualDOM[]

    constructor() {
        this.children = [
            {
                tag: 'i',
                innerText: 'Find-out more plugins and how to install them',
                children: [
                    {
                        tag: 'span',
                        class: 'fv-pointer fv-bg-background-alt rounded border fv-hover-xx-lighter mx-1 px-1',
                        innerText: 'here',
                        onclick: () => {
                            ChildApplicationAPI.getOsInstance()
                                .createInstance$({
                                    cdnPackage: '@youwol/stories',
                                    parameters: {
                                        id: '5f48f380-9f0b-4854-ad7a-788d70c1ce6b',
                                        mode: 'reader',
                                    },
                                    version: 'latest',
                                    focus: true,
                                })
                                .subscribe()
                        },
                    },
                ],
            },
        ]
    }
}

export class PluginsListView implements VirtualDOM {
    public readonly class = 'w-100 flex-grow-1 overflow-auto my-1'
    public readonly children
    constructor(params: { state: GrapesEditorState }) {
        this.children = children$(
            Installer.getInstallManifest$().pipe(
                map(({ applicationsData }) => {
                    const toolboxes =
                        applicationsData['@youwol/stories'] &&
                        applicationsData['@youwol/stories'].toolboxes
                    return toolboxes || []
                }),
            ),
            (toolboxes: string[]) => {
                return toolboxes.map((toolbox) => {
                    return new PluginView({
                        plugin: { packageName: toolbox },
                        state: params.state.appState,
                    })
                })
            },
        )
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
