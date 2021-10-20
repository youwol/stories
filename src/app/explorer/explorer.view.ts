import { attr$, child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree"
import { filter, map } from "rxjs/operators";
import { AppState, SavingStatus } from "../main-app/app-state";
import { Document } from "../client/client";
import { ContextMenuState } from "./context-menu/context-menu.view";
import { ContextMenu } from '@youwol/fv-context-menu'
import { DocumentNode, ExplorerNode, StoryNode, SignalType } from "./nodes"

/**
 * Logic side of [[ExplorerView]]
 */
export class ExplorerState extends ImmutableTree.State<ExplorerNode>{

    public readonly appState: AppState

    constructor({ rootDocument, appState }: {
        rootDocument: Document,
        appState: AppState
    }) {
        let rootNode = new StoryNode({ story: appState.story, rootDocument })
        super({
            rootNode,
            selectedNode: appState.selectedNode$,
            expandedNodes: ['library']
        })
        this.appState = appState
        appState.selectNode(rootNode)
        appState.deletedDocument$.subscribe((document) => {
            this.removeNode(document.documentId)
            this.selectedNode$.next(this.getNode(rootNode.id))
        })
    }
}

/**
 * View of a story's tree structure
 */
export class ExplorerView extends ImmutableTree.View<ExplorerNode> {

    public readonly appState: AppState

    public readonly style = {
        minWidth: '300px'
    }
    public readonly class = 'p-2 border fv-color-primary'

    constructor({ explorerState }: {
        explorerState: ExplorerState
    }) {
        super({
            state: explorerState,
            headerView
        } as any)

        this.appState = explorerState.appState
        this.connectedCallback = (explorerDiv: HTMLElement$ & HTMLDivElement) => {
            let contextState = new ContextMenuState({
                appState: this.appState,
                explorerState: this.state as ExplorerState,
                explorerDiv
            })
            return new ContextMenu.View({ state: contextState, class: "fv-bg-background border fv-color-primary" } as any)
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
    explorerState: ExplorerState
): VirtualDOM {

    return {
        tag: 'input',
        type: 'text',
        autofocus: true,
        style: {
            zIndex: 200
        },
        class: "mx-2",
        data: node.name,
        onclick: (ev) => ev.stopPropagation(),
        onkeydown: (ev) => {
            if (ev.key === 'Enter') {
                explorerState.appState.rename(node, ev.target.value)
            }
        }
    }
}

/**
 * Create explorer's node view
 * 
 * @param state explorer state
 * @param node node to display
 * @returns the view
 */
function headerView(
    state: ExplorerState,
    node: ExplorerNode
): VirtualDOM {

    let faClass = ""
    let id = ""
    let nodeClass = ""
    if (node instanceof StoryNode) {
        faClass = "fas fa-book-open"
        id = node.story.storyId
        nodeClass = "story"
    }
    if (node instanceof DocumentNode) {
        faClass = "fas fa-file"
        id = node.document.documentId
        nodeClass = "document"
    }

    return {
        id,
        class: `d-flex align-items-center fv-pointer fv-hover-bg-background-alt w-100 ${nodeClass}`,
        children: [
            {
                class: faClass + " px-2",
            },
            child$(
                node.signal$.pipe(
                    filter((signal) => signal.type == SignalType.Rename)
                ),
                () => {
                    return headerRenamed(node as any, state)
                },
                {
                    untilFirst: {
                        tag: 'span',
                        innerText: node.name
                    } as any
                }
            ),
            {
                class: attr$(
                    state.appState.save$.pipe(
                        filter(({ document }) =>
                            document.documentId == node.getDocument().documentId
                        ),
                        map(({ status }) => status)
                    ),
                    (status) => {
                        return status == SavingStatus.started
                            ? 'fas fa-circle px-2'
                            : ''
                    }
                ),
                style: {
                    transform: 'scale(0.5)'
                }
            }
        ]
    }
}
