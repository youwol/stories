import { Document, ExplorerNode, Permissions, Story } from '../common'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { TopBannerState } from './top-banner'
import { ExplorerState, ExplorerView } from './explorer.view'
import * as Dockable from '../common/dockable-tabs/dockable-tabs.view'
import { StructureTab } from '../common/side-nav.view'
import { GetGlobalContentResponse } from '@youwol/http-clients/dist/lib/stories-backend'

export class AppStateReader {
    public readonly story: Story
    public readonly rootDocument: Document
    public readonly permissions: Permissions

    public readonly selectedNode$ = new ReplaySubject<ExplorerNode>(1)
    public readonly topBannerState: TopBannerState
    public readonly leftNavState: Dockable.State
    public readonly explorerState: ExplorerState
    public readonly globalContents: GetGlobalContentResponse

    constructor(params: {
        story: Story
        globalContents: GetGlobalContentResponse
        rootDocument: Document
        permissions?
    }) {
        Object.assign(this, params)
        this.topBannerState = new TopBannerState({
            permissions: this.permissions,
        })

        this.explorerState = new ExplorerState({
            rootDocument: this.rootDocument,
            appState: this,
        })

        this.leftNavState = new Dockable.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<Dockable.DisplayMode>('pined'),
            tabs$: new BehaviorSubject([
                new StructureTab({
                    explorerView: new ExplorerView({
                        explorerState: this.explorerState,
                    }),
                }),
            ]),
            selected$: new BehaviorSubject<string>('structure'),
        })
    }

    selectNode(node: ExplorerNode) {
        this.selectedNode$.next(node)
    }
}
