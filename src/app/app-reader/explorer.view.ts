import { VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import { AppStateReader } from './app-state'

import { DocumentNode, ExplorerNode, StoryNode, Document } from '../common'

/**
 * Logic side of [[ExplorerView]]
 */
export class ExplorerState extends ImmutableTree.State<ExplorerNode> {
    public readonly appState: AppStateReader

    constructor({
        rootDocument,
        appState,
    }: {
        rootDocument: Document
        appState: AppStateReader
    }) {
        const rootNode = new StoryNode({ story: appState.story, rootDocument })
        super({
            rootNode,
            selectedNode: appState.selectedNode$,
            expandedNodes: [appState.story.storyId],
        })
        this.appState = appState
        appState.selectNode(rootNode)
    }
}

/**
 * View of a story's tree structure
 */
export class ExplorerView extends ImmutableTree.View<ExplorerNode> {
    public readonly appState: AppStateReader

    public readonly class = ''

    constructor({ explorerState }: { explorerState: ExplorerState }) {
        super({
            state: explorerState,
            headerView,
        })
        this.appState = explorerState.appState
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
    let faClass = ''
    let id = ''
    let nodeClass = ''
    if (node instanceof StoryNode) {
        faClass = 'fas fa-book-open'
        id = node.story.storyId
        nodeClass = 'story'
    }
    if (node instanceof DocumentNode) {
        faClass = 'fas fa-file'
        id = node.document.documentId
        nodeClass = 'document'
    }

    return {
        id,
        class: `d-flex align-items-center fv-pointer fv-hover-font-bolder ${nodeClass}`,
        children: [
            {
                class: faClass + ' px-2',
            },
            {
                tag: 'span',
                style: { userSelect: 'none' },
                innerText: node.name,
            },
        ],
    }
}
