import { Document, ExplorerNode, Permissions, Story } from '../common'
import { BehaviorSubject, from, Observable, ReplaySubject } from 'rxjs'
import { ExplorerState, ExplorerView } from './explorer.view'
import * as Dockable from '../common/dockable-tabs/dockable-tabs.view'
import { StructureTab } from '../common/side-nav.view'
import {
    AssetsGateway,
    StoriesBackend,
    raiseHTTPErrors,
} from '@youwol/http-clients'

import {
    distinctUntilChanged,
    map,
    mergeMap,
    reduce,
    shareReplay,
    take,
    tap,
} from 'rxjs/operators'

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

    /**
     * @group Observables
     */
    public readonly preloadDocuments$: Observable<
        { id: string; content: StoriesBackend.DocumentContentBody }[]
    >

    private documentsInMemory: {
        id: string
        content: StoriesBackend.DocumentContentBody
    }[] = []

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

        this.preloadDocuments$ = this.getDocumentsPreload$().pipe(
            shareReplay({ bufferSize: 1, refCount: true }),
        )
    }

    selectNode(node: ExplorerNode) {
        this.selectedNode$.next(node)
    }

    getDocumentsPreload$(): Observable<
        { id: string; content: StoriesBackend.DocumentContentBody }[]
    > {
        const storiesClient = new AssetsGateway.AssetsGatewayClient().stories
        return this.explorerState.selectedNode$.pipe(
            distinctUntilChanged((node1, node2) => node1.id == node2.id),
            mergeMap((node) => {
                this.explorerState.getChildren(node)
                return this.explorerState.getChildren$(node).pipe(
                    take(1),
                    map((children) => [node, children]),
                )
            }),
            map(([node, children]: [ExplorerNode, Array<ExplorerNode>]) => {
                const sortedChildren = [...children].sort(
                    (a, b) => a.position - b.position,
                )
                if (!this.explorerState.getParent(node.id)) {
                    return { node, firstChild: sortedChildren[0] }
                }
                const siblings = this.explorerState
                    .getParent(node.id)
                    .resolvedChildren()

                const index_current = [...siblings]
                    .sort(
                        (a: ExplorerNode, b: ExplorerNode) =>
                            a.position - b.position,
                    )
                    .findIndex((n) => n.id == node.id)
                if (index_current + 1 >= siblings.length) {
                    return { node, firstChild: sortedChildren[0] }
                }
                return {
                    node,
                    firstChild: sortedChildren[0],
                    nextSibling: siblings[index_current + 1],
                }
            }),
            map((nodes) => Object.values(nodes).filter((n) => n != undefined)),
            map((nodes) =>
                nodes.filter(
                    (n) =>
                        this.documentsInMemory.find((doc) => doc.id == n.id) ==
                        undefined,
                ),
            ),
            mergeMap((nodes) => {
                return from(nodes).pipe(
                    mergeMap((node: ExplorerNode) => {
                        return storiesClient
                            .getContent$({
                                storyId: node.story.storyId,
                                documentId: node.id,
                            })
                            .pipe(
                                raiseHTTPErrors(),
                                map((content) => ({ id: node.id, content })),
                                tap((doc) => {
                                    this.documentsInMemory = [
                                        ...this.documentsInMemory,
                                        doc,
                                    ]
                                }),
                            )
                    }),
                    reduce((acc, e) => {
                        return [...acc, e]
                    }, []),
                )
            }),
        )
    }
}
