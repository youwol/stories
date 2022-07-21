import { Document, ExplorerNode, Permissions, Story } from '../common'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { ExplorerState, ExplorerView } from './explorer.view'
import * as Dockable from '../common/dockable-tabs/dockable-tabs.view'
import { StructureTab } from '../common/side-nav.view'
import { StoriesBackend } from '@youwol/http-clients'

/**
 * @category State
 */
export class AppStateReader {
    /**
     * @group Immutable Constants
     */
    public readonly story: Story

    /**
     * @group Immutable Constants
     */
    public readonly rootDocument: Document
    /**
     * @group Immutable Constants
     */
    public readonly permissions: Permissions

    /**
     * @group Observables
     */
    public readonly selectedNode$ = new ReplaySubject<ExplorerNode>(1)

    /**
     * @group States
     */
    public readonly leftNavState: Dockable.State

    /**
     * @group States
     */
    public readonly explorerState: ExplorerState

    /**
     * @group Immutable Constants
     */
    public readonly globalContents: StoriesBackend.GetGlobalContentResponse

    constructor(params: {
        story: Story
        globalContents: StoriesBackend.GetGlobalContentResponse
        rootDocument: Document
        permissions?
    }) {
        Object.assign(this, params)

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
