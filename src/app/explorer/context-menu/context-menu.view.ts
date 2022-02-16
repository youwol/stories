import { ContextMenu } from '@youwol/fv-context-menu'
import { fromEvent, Observable } from 'rxjs'
import { filter, tap } from 'rxjs/operators'
import { AppState } from '../../main-app/app-state'
import {
    ALL_ACTIONS,
    ContextRootNode,
    ContextTreeNode,
    isExecutable,
} from './context-menu.nodes'
import { ImmutableTree } from '@youwol/fv-tree'
import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { ExplorerState } from '../explorer.view'
import { ExplorerNode } from '../nodes'

/**
 * Logic side of [[ContextMenuView]]
 */
export class ContextMenuState extends ContextMenu.State {
    public readonly appState: AppState
    public readonly explorerState: ExplorerState
    public readonly explorerDiv: HTMLDivElement

    constructor({
        appState,
        explorerState,
        explorerDiv,
    }: {
        appState: AppState
        explorerState: ExplorerState
        explorerDiv: HTMLDivElement
    }) {
        super(
            fromEvent(explorerDiv, 'contextmenu').pipe(
                tap((ev: Event) => ev.preventDefault()),
            ) as Observable<MouseEvent>,
        )
        this.appState = appState
        this.explorerState = explorerState
        this.explorerDiv = explorerDiv
    }

    dispatch(ev: MouseEvent): VirtualDOM {
        return {
            style: {
                zIndex: 1,
            },
            children: [
                child$(this.appState.selectedNode$, (node: ExplorerNode) => {
                    return new ContextMenuView({
                        state: this,
                        selectedNode: node,
                    })
                }),
            ],
        }
    }
}

/**
 * Context-menu view
 */
export class ContextMenuView implements VirtualDOM {
    public readonly id = 'context-menu-view'
    public readonly children: Array<VirtualDOM>

    public readonly connectedCallback: (
        element: HTMLElement$ & HTMLDivElement,
    ) => void

    public readonly state: ContextMenuState
    public readonly selectedNode: ExplorerNode

    constructor(params: {
        state: ContextMenuState
        selectedNode: ExplorerNode
    }) {
        Object.assign(this, params)

        const actionViews = Object.values(ALL_ACTIONS)
            .filter((action) => action.applicable(this.selectedNode))
            .map((action) =>
                action.createNode(
                    this.selectedNode as any,
                    this.state.explorerState,
                ),
            )

        const rootNode = new ContextRootNode({ children: actionViews })
        const contextTreeState = new ImmutableTree.State<ContextTreeNode>({
            rootNode,
            expandedNodes: [rootNode.id],
        })
        contextTreeState.selectedNode$.next(rootNode)

        this.children = [
            new ImmutableTree.View({
                state: contextTreeState,
                headerView: (_, node) => headerView(node),
                class: 'fv-bg-background fv-text-primary p-2 rounded border fv-color-primary',
            } as any),
        ]
        this.connectedCallback = (
            htmlElement: HTMLElement$ & HTMLDivElement,
        ) => {
            const sub = contextTreeState.selectedNode$
                .pipe(filter((node) => isExecutable(node)))
                .subscribe((node: any) => {
                    htmlElement.remove()
                    node.execute(this)
                })
            htmlElement.ownSubscriptions(sub)
        }
    }
}

/**
 * Creates context menu tree-view's node view
 * @param node context menu node
 * @returns the view
 */
function headerView(node: ContextTreeNode): VirtualDOM {
    return {
        class: 'd-flex w-100 align-items-baseline fv-pointer fv-hover-bg-background-alt px-1',
        children: [
            { tag: 'i', class: node.faIcon },
            {
                tag: 'span',
                class: 'mx-2 w-100',
                innerText: node.name,
                style: { 'user-select': 'none' },
            },
        ],
    }
}
