import { Document, ExplorerNode, Permissions, Story } from '../common'
import { ReplaySubject } from 'rxjs'
import { TopBannerState } from './top-banner'
import { ExplorerState } from './explorer.view'

export class AppStateReader {
    public readonly story: Story
    public readonly rootDocument: Document
    public readonly permissions: Permissions

    public readonly selectedNode$ = new ReplaySubject<ExplorerNode>(1)
    public readonly topBannerState: TopBannerState

    public readonly explorerState: ExplorerState

    constructor(params: {
        story: Story
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
    }

    selectNode(node: ExplorerNode) {
        this.selectedNode$.next(node)
    }
}
