import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree"
import { filter } from "rxjs/operators";
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
            expandedNodes: [appState.story.storyId]
        })
        this.appState = appState
        appState.selectNode(rootNode)
        appState.deletedDocument$.subscribe((document) => {
            this.removeNode(document.documentId)
            this.selectedNode$.next(this.getNode(rootNode.id))
        })
        appState.addedDocument$.subscribe(({ parentDocumentId, document }) => {
            let childNode = new DocumentNode({ story: this.appState.story, document })
            this.addChild(parentDocumentId, childNode)
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
            child$(
                state.appState.save$.pipe(
                    filter(({ document }) =>
                        document.documentId == node.getDocument().documentId
                    ),
                ),
                ({ document, content, status }: { document: Document, content: string, status: SavingStatus }) => {
                    switch (status) {
                        case SavingStatus.modified:
                            return {
                                class: 'fas fa-save p-1 ml-auto fv-pointer fv-hover-opacity-100 fv-opacity-50 fv-opacity-transition-500 explorer-save-item',
                                onclick: () => state.appState.save(document, content)
                            }
                        case SavingStatus.started:
                            return {
                                class: 'fas fa-spinner fa-spin p-1 ml-auto '
                            }
                        default:
                            return {}
                    }
                }
            )
        ]
    }
}
