import { child$, children$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { filter } from 'rxjs/operators'
import { AppState } from '../app-state'
import { ContextMenuState } from './context-menu/context-menu.view'
import { ContextMenu } from '@youwol/fv-context-menu'
import {
    DocumentNode,
    ExplorerNode,
    StoryNode,
    Document,
    NodeSignal,
} from '../../common'

import {
    ExplorerBaseState,
    ExplorerBaseView,
    nodeViewElements,
} from '../../common/explorer-base.view'
import { ImmutableTree } from '@youwol/fv-tree'
import { MetadataMoveCmd } from '../http-handler'

/**
 * Logic side of [[ExplorerView]]
 */
export class ExplorerState extends ExplorerBaseState {
    public readonly appState: AppState

    constructor(params: { rootDocument: Document; appState: AppState }) {
        super(params)

        this.appState.deletedDocument$.subscribe((document) => {
            this.removeNode(document.documentId)
            this.selectedNode$.next(this.getNode(this.rootNode.id))
        })
        this.appState.addedDocument$.subscribe(
            ({ parentDocumentId, document }) => {
                const childNode = new DocumentNode({
                    story: this.appState.story,
                    document,
                })
                if (Array.isArray(this.getNode(parentDocumentId).children))
                    this.addChild(parentDocumentId, childNode)
            },
        )
    }
}

/**
 * View of a story's tree structure
 */
export class ExplorerView extends ExplorerBaseView {
    constructor({ explorerState }: { explorerState: ExplorerState }) {
        super({
            explorerState,
            headerView: (state: ExplorerState, node: ExplorerNode) =>
                new HeaderView({ node, state }),
            dropAreaView: (state, parent, children, index) => {
                return new DragInInsertView({ state, parent, children, index })
            },
        })

        this.connectedCallback = (
            explorerDiv: HTMLElement$ & HTMLDivElement,
        ) => {
            const contextState = new ContextMenuState({
                appState: this.appState as AppState,
                explorerState: this.state as ExplorerState,
                explorerDiv,
            })
            return new ContextMenu.View({
                state: contextState,
                class: 'fv-bg-background border fv-color-primary',
                style: {
                    zIndex: 20,
                },
            } as any)
        }
    }
}

/**
 * Create renaming node's view
 *
 * @param node node to rename
 * @param explorerState explorer state
 * @returns the view
 */
function headerRenamed(
    node: DocumentNode | StoryNode,
    explorerState: ExplorerState,
): VirtualDOM {
    return {
        tag: 'input',
        type: 'text',
        autofocus: true,
        style: {
            zIndex: 200,
        },
        class: 'mx-2',
        data: node.name,
        onclick: (ev) => ev.stopPropagation(),
        onkeydown: (ev) => {
            if (ev.key === 'Enter') {
                explorerState.appState.rename(node, ev.target.value)
            }
        },
    }
}

class HeaderView implements VirtualDOM {
    public readonly node: ExplorerNode
    public readonly state: ExplorerState
    public readonly draggable = true
    public readonly ondragstart = (ev: DragEvent) => {
        ev.dataTransfer.setData('nodeId', this.node.id)
    }
    public readonly children: VirtualDOM[]
    public readonly class =
        'd-flex flex-column align-items-center fv-pointer fv-hover-xx-darker'

    constructor(params: { state: ExplorerState; node: ExplorerNode }) {
        Object.assign(this, params)
        const { iconView, headerClasses } = nodeViewElements(this.node)
        this.children = [
            {
                class: headerClasses,
                children: [
                    iconView,
                    child$(
                        this.node.signal$.pipe(
                            filter((signal) => signal == 'rename'),
                        ),
                        () => {
                            return headerRenamed(
                                this.node as DocumentNode | StoryNode,
                                this.state,
                            )
                        },
                        {
                            untilFirst: {
                                tag: 'span',
                                innerText: this.node.name,
                            },
                        },
                    ),
                    {
                        children: children$(this.node.processes$, (processes) =>
                            processes.map((p) => new StatusView(p)),
                        ),
                    },
                ],
            },
        ]
    }
}

class StatusView implements VirtualDOM {
    static Factory: Record<
        NodeSignal,
        { style: { [k: string]: string }; class: string }
    > = {
        'children-fetching': {
            style: { transform: 'scale(0.8)' },
            class: 'fas fa-spinner fa-spin p-1 ml-auto',
        },
        'content-changed': {
            style: { transform: 'scale(0.5)' },
            class: 'fas fa-circle p-1 ml-auto ',
        },
        'content-saving': {
            style: { transform: 'scale(0.5)' },
            class: 'fas fa-circle p-1 ml-auto ',
        },
        rename: {
            style: {},
            class: '',
        },
    }
    public readonly style: { [k: string]: string }
    public readonly class: string
    constructor({ type }: { type: NodeSignal }) {
        this.class = StatusView.Factory[type].class
        this.style = StatusView.Factory[type].style
    }
}

class DragInInsertView implements VirtualDOM {
    public readonly class = 'w-100'
    public readonly style = {
        height: '5px',
    }
    public readonly index: number
    public readonly parent: ExplorerNode
    public readonly children: ExplorerNode[]

    public readonly state: ImmutableTree.State<ExplorerNode>

    ondragover = (ev) => {
        ev.preventDefault()
    }
    ondragenter = (ev) => {
        ev.target.classList.add('fv-bg-focus')
    }
    ondragleave = (ev) => {
        ev.target.classList.remove('fv-bg-focus')
    }
    ondrop = (ev: DragEvent) => {
        let This = ev.target as unknown as DragInInsertView
        const nodeAbove =
            this.index < this.children.length
                ? this.children[this.index]
                : undefined
        let newPosition = this.children[0].position - 1
        if (this.index > 0) {
            newPosition =
                0.5 *
                (this.children[this.index - 1].position +
                    this.children[this.index].position)
        }
        if (this.index == this.children.length) {
            newPosition = this.children[this.index - 1].position + 1
        }

        this.state.moveNode(
            ev.dataTransfer.getData('nodeId'),
            {
                reference: nodeAbove ? nodeAbove.id : This.parent.id,
                direction: nodeAbove ? 'below' : undefined,
            },
            true,
            () => ({}),
            new MetadataMoveCmd(This.parent.id, newPosition),
        )
    }

    constructor(params: {
        state: ImmutableTree.State<ExplorerNode>
        parent: ExplorerNode
        children: ExplorerNode[]
        index: number
    }) {
        Object.assign(this, params)
    }
}
