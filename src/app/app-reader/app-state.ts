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

function getConfiguration() {
    const searchParams = new URLSearchParams(window.location.search)
    const userConfig =
        searchParams.has('config') &&
        JSON.parse(
            window.atob(
                searchParams.has('config') && searchParams.get('config'),
            ),
        )
    return {
        explorer: {
            viewState:
                (userConfig &&
                    userConfig.explorer &&
                    userConfig.explorer.viewState) ||
                'pined',
        },
    }
}

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
    public readonly globalJavascript$: BehaviorSubject<string>

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
        this.globalJavascript$ = new BehaviorSubject<string>(
            this.globalContents.javascript,
        )
        this.globalJavascript$
            .pipe(
                mergeMap((js) => {
                    const promise = new Function(js)()(window)
                    return from(promise).pipe(map((data) => data))
                }),
            )
            .subscribe((data) => {
                window['globalJavascript'] = data
            })
        this.explorerState = new ExplorerState({
            rootDocument: this.rootDocument,
            appState: this,
        })

        const config = getConfiguration()
        this.leftNavState = new Dockable.State({
            disposition: 'left',
            viewState$: new BehaviorSubject<Dockable.DisplayMode>(
                config.explorer.viewState as Dockable.DisplayMode,
            ),
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
        const nextSibling = (node) => {
            const parent = this.explorerState.getParent(node.id)
            if (!parent) {
                return undefined
            }
            const siblings = parent.resolvedChildren()

            const index_current = [...siblings]
                .sort(
                    (a: ExplorerNode, b: ExplorerNode) =>
                        a.position - b.position,
                )
                .findIndex((n) => n.id == node.id)

            if (index_current < siblings.length) {
                return siblings[index_current + 1]
            }
            nextSibling(parent)
        }

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
                return sortedChildren.length > 0
                    ? { node, next: sortedChildren[0] }
                    : { node, next: nextSibling(node) }
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
