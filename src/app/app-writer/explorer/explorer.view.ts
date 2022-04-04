import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { filter } from 'rxjs/operators'
import { AppState } from '../app-state'
import { ContextMenuState } from './context-menu/context-menu.view'
import { ContextMenu } from '@youwol/fv-context-menu'
import { DocumentNode, ExplorerNode, StoryNode, Document } from '../../common'

import {
    ExplorerBaseState,
    ExplorerBaseView,
    nodeViewElements,
} from '../../common/explorer-base.view'

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
            headerView,
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

/**
 * Create explorer's node view
 *
 * @param state explorer state
 * @param node node to display
 * @returns the view
 */
function headerView(state: ExplorerState, node: ExplorerNode): VirtualDOM {
    const { iconView, headerClasses } = nodeViewElements(node)

    return {
        id: node.id,
        class: headerClasses,
        children: [
            iconView,
            child$(
                node.signal$.pipe(filter((signal) => signal == 'rename')),
                () => {
                    return headerRenamed(
                        node as DocumentNode | StoryNode,
                        state,
                    )
                },
                {
                    untilFirst: {
                        tag: 'span',
                        innerText: node.name,
                    },
                },
            ),
            child$(node.signal$, (signal) => {
                switch (signal) {
                    case 'content-saved':
                        return {}
                    case 'content-saving':
                        return {
                            style: { transform: 'scale(0.8)' },
                            class: 'fas fa-save p-1 ml-auto',
                        }
                    case 'content-changed':
                        return {
                            style: { transform: 'scale(0.5)' },
                            class: 'fas fa-circle p-1 ml-auto ',
                        }
                    default:
                        return {}
                }
            }),
        ],
    }
}
