import { ImmutableTree } from '@youwol/fv-tree'

import {
    ExplorerNode,
    StoryNode,
    Document,
    AppStateCommonInterface,
    DocumentNode,
} from '../common'
import THeaderView = ImmutableTree.THeaderView
import TDropAreaView = ImmutableTree.TDropAreaView

/**
 * Logic side of [[ExplorerView]]
 */
export class ExplorerBaseState extends ImmutableTree.State<ExplorerNode> {
    public readonly appState: AppStateCommonInterface
    public readonly rootNode: StoryNode
    constructor({
        rootDocument,
        appState,
    }: {
        rootDocument: Document
        appState: AppStateCommonInterface
    }) {
        const rootNode = new StoryNode({ story: appState.story, rootDocument })
        super({
            rootNode,
            selectedNode: appState.selectedNode$,
            expandedNodes: [appState.story.storyId],
        })
        this.appState = appState
        this.rootNode = rootNode
        appState.selectNode(rootNode)
    }
}

/**
 * View of a story's tree structure
 */
export class ExplorerBaseView extends ImmutableTree.View<ExplorerNode> {
    public readonly appState: AppStateCommonInterface

    public readonly class = 'py-2'

    constructor({
        explorerState,
        headerView,
        dropAreaView,
    }: {
        explorerState: ExplorerBaseState
        headerView: THeaderView<ExplorerNode>
        dropAreaView?: TDropAreaView<ExplorerNode>
    }) {
        super({
            state: explorerState,
            headerView,
            dropAreaView,
        })
        this.appState = explorerState.appState
    }
}

export function nodeViewElements(node: ExplorerNode) {
    type NodeType = 'StoryNode' | 'DocumentNode'
    let type: NodeType
    if (node instanceof StoryNode) type = 'StoryNode'
    if (node instanceof DocumentNode) type = 'DocumentNode'

    const iconsClass: Record<NodeType, string> = {
        StoryNode: 'fas fa-book-open',
        DocumentNode: 'fas fa-file',
    }
    const baseHeaderClass =
        'd-flex align-items-center fv-pointer fv-hover-xx-darker'
    const headerClasses: Record<NodeType, string> = {
        StoryNode: `${baseHeaderClass} story`,
        DocumentNode: `${baseHeaderClass} document`,
    }
    return {
        iconView: {
            class: `${iconsClass[type]} px-2`,
        },
        headerClasses: headerClasses[type],
    }
}
