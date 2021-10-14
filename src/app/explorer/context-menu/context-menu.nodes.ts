import { ImmutableTree } from '@youwol/fv-tree'
import { Client, Document } from '../../client/client'
import { ExplorerState } from '../explorer.view'
import { StoryNode, DocumentNode, SignalType, ExplorerNode } from '../nodes'
import { ContextMenuState } from './context-menu.view'

/**
 * Factory of available actions in the
 * tree-view's context-menu
 */
export let ALL_ACTIONS = {
    newPage: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode || selectedNode instanceof StoryNode,
        createNode: (documentNode: DocumentNode, explorerState: ExplorerState) =>
            new AddDocumentNode({
                parentNode: documentNode,
                explorerState
            })
    },
    deleteDocument: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode,
        createNode: (deletedNode: DocumentNode, explorerState: ExplorerState) =>
            new DeleteDocumentNode({
                deletedNode,
                explorerState
            })
    },
    renameStoryNode: {
        applicable: (selectedNode) => selectedNode instanceof StoryNode,
        createNode: (node: StoryNode, explorerState: ExplorerState) =>
            new RenameNode<StoryNode>({
                node,
                explorerState
            })
    },
    renameDocumentNode: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode,
        createNode: (node: DocumentNode, explorerState: ExplorerState) =>
            new RenameNode<DocumentNode>({
                node,
                explorerState
            })
    }
}

/**
 * Interface of executable nodes of the context menu
 */
export interface ExecutableNode{
    execute(state: ContextMenuState, { event }: { event: MouseEvent })
}

/**
 * Base class of tree-view node of the context menu
 */
export class ContextTreeNode extends ImmutableTree.Node {

    public readonly faIcon
    public readonly name

    constructor({ id, children, name, faIcon }: { id: string, children: Array<ContextTreeNode>, name: string, faIcon: string }) {
        super({ id, children })
        this.name = name
        this.faIcon = faIcon
    }
}

/**
 * Type guard against [[ExecutableNode]]
 */
export function isExecutable(node: ExecutableNode | ContextTreeNode): node is ExecutableNode{
    return (node as any as ExecutableNode).execute !== undefined
} 

/**
 * Root node type of the context-menu's tree-view
 */
export class ContextRootNode extends ContextTreeNode {

    constructor({ children }: { children: Array<ContextTreeNode> }) {
        super({ id: 'root', children, name: 'menu list', faIcon: '' })
    }
}

/**
 * Add document node type of the context-menu's tree-view
 */
export class AddDocumentNode extends ContextTreeNode {

    constructor(params: {
        explorerState: ExplorerState,
        parentNode: DocumentNode
    }) {
        super({
            id: 'add-document',
            children: [
                new EmptyDocNode(params),
            ],
            name: 'new document',
            faIcon: 'fas fa-plus'
        })
        Object.assign(this, params)
    }

}


 export class EmptyDocNode extends ContextTreeNode implements ExecutableNode {

    public readonly explorerState: ExplorerState
    public readonly parentNode: DocumentNode | StoryNode

    constructor(params: {
        explorerState: ExplorerState,
        parentNode: DocumentNode
    }) {
        super({
            id: 'add-document-empty',
            children: undefined,
            name: 'empty document',
            faIcon: 'fas fa-file'
        })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState
    ) {
        createDocument({
            parentNode: this.parentNode,
            explorerState: this.explorerState,
            content: "",
            name:"New document"
        })
    }
}
        )
            .subscribe((document: Document) => {
                let childNode = new DocumentNode({ story: this.parentNode.story, document })
                this.explorerState.addChild(this.parentNode, childNode)
            })
    }
}

/**
 * Rename document node type of the context-menu's tree-view
 */
export class RenameNode<TNode extends ExplorerNode> 
extends ContextTreeNode 
implements ExecutableNode {

    public readonly explorerState: ExplorerState
    public readonly node: TNode

    constructor(params: {
        explorerState: ExplorerState,
        node: TNode
    }) {
        super({ 
            id: params.node instanceof DocumentNode ? 'rename-document' : 'rename-story', 
            children: undefined, 
            name: params.node instanceof DocumentNode ? 'rename document' : 'rename story', 
            faIcon: 'fas fa-pen' })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState
    ) {
        this.node.signal$.next({
            type: SignalType.Rename
        })
    }
}

/**
 * Delete document node type of the context-menu's tree-view
 */
export class DeleteDocumentNode extends ContextTreeNode implements ExecutableNode {

    public readonly explorerState: ExplorerState
    public readonly deletedNode: DocumentNode

    constructor(params: {
        explorerState: ExplorerState,
        deletedNode: DocumentNode
    }) {
        super({ id: 'delete-document', children: undefined, name: 'delete document', faIcon: 'fas fa-trash' })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState
    ) {
        Client
        .deleteDocument$(this.deletedNode.story.storyId, this.deletedNode.document.documentId)
        .subscribe( () => {
            this.explorerState.removeNode(this.deletedNode)
        })
    }
}


function createDocument({parentNode, explorerState, content, name}:{
    parentNode : StoryNode | DocumentNode,
    explorerState: ExplorerState,
    content: string,
    name: string
}){
    let body = parentNode instanceof StoryNode
        ? {
            parentDocumentId: parentNode.rootDocument.documentId,
            title: name,
            content: content
        }
        : {
            parentDocumentId: parentNode.document.documentId,
            title: name,
            content: content
        }
    Client.putDocument$(
        parentNode.story.storyId,
        body
    )
        .subscribe((document: Document) => {
            let childNode = new DocumentNode({ story: parentNode.story, document })
            explorerState.addChild(parentNode, childNode)
        })
}