import { child$, children$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { filter } from 'rxjs/operators'
import { AppState } from '../app-state'
import { ContextMenuState } from './context-menu'
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
 *
 * @category State
 */
export class ExplorerState extends ExplorerBaseState {
    /**
     * @group States
     */
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
 *
 * @category View
 * @category Getting Started
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
 *
 * @category View
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

/**
 * @category View
 */
class HeaderView implements VirtualDOM {
    /**
     * @group Immutable Constants
     */
    public readonly node: ExplorerNode

    /**
     * @group States
     */
    public readonly state: ExplorerState

    /**
     * @group Immutable DOM Constants
     */
    public readonly draggable = true

    /**
     * @group Immutable DOM Constants
     */
    public readonly ondragstart = (ev: DragEvent) => {
        ev.dataTransfer.setData('nodeId', this.node.id)
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
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

    /**
     * @group Immutable DOM Constants
     */
    public readonly style: { [k: string]: string }

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: string
    constructor({ type }: { type: NodeSignal }) {
        this.class = StatusView.Factory[type].class
        this.style = StatusView.Factory[type].style
    }
}

/**
 * @category View
 */
class DragInInsertView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        height: '5px',
    }

    /**
     * @group Immutable Constants
     */
    public readonly index: number

    /**
     * @group Immutable Constants
     */
    public readonly parent: ExplorerNode

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ExplorerNode[]

    /**
     * @group States
     */
    public readonly state: ImmutableTree.State<ExplorerNode>

    /**
     * @group Immutable DOM Constants
     */
    ondragover = (ev) => {
        ev.preventDefault()
    }

    /**
     * @group Immutable DOM Constants
     */
    ondragenter = (ev: MouseEvent) => {
        const elem: HTMLElement = ev.target as HTMLElement
        elem.classList.add('fv-bg-focus')
        elem.parentElement.parentElement.classList.add('drag-as-child')
    }

    /**
     * @group Immutable DOM Constants
     */
    ondragleave = (ev) => {
        const elem: HTMLElement = ev.target as HTMLElement
        ev.target.classList.remove('fv-bg-focus')
        elem.parentElement.parentElement.classList.remove('drag-as-child')
    }

    /**
     * @group Immutable DOM Constants
     */
    ondrop = (ev: DragEvent) => {
        let This = ev.target as unknown as DragInInsertView
        const nodeAbove =
            this.index < this.children.length
                ? this.children[this.index]
                : undefined
        let newPosition = this.children[0].position - 1
        if (this.index == this.children.length) {
            newPosition = this.children[this.index - 1].position + 1
        } else if (this.index > 0) {
            newPosition =
                0.5 *
                (this.children[this.index - 1].position +
                    this.children[this.index].position)
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
