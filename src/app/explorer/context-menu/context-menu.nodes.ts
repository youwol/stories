import { ImmutableTree } from '@youwol/fv-tree'
import { Client, Story, Document } from '../../client/client'
import { ExplorerState } from '../explorer.view'
import { nodesFactory, StoryNode, LibraryNode, DocumentNode } from '../nodes'
import { ContextMenuState } from './context-menu.view'




export let ALL_ACTIONS = {
    newStory: {
        applicable: (selectedNode) => selectedNode instanceof LibraryNode,
        createNode: (libraryNode: LibraryNode, explorerState: ExplorerState) =>
            new AddStoryNode({
                libraryNode,
                explorerState
            })
    },
    newPage: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode || selectedNode instanceof StoryNode,
        createNode: (documentNode: DocumentNode, explorerState: ExplorerState) =>
            new AddDocumentNode({
                parentNode: documentNode,
                explorerState
            })
    },
    deleteStory: {
        applicable: (selectedNode) => selectedNode instanceof StoryNode,
        createNode: (deletedNode: StoryNode, explorerState: ExplorerState) =>
            new DeleteStoryNode({
                deletedNode,
                explorerState
            })
    },
    renameDocumentNode: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode,
        createNode: (node: DocumentNode, explorerState: ExplorerState) =>
            new RenameDocumentNode({
                node,
                explorerState
            })
    }
}

export class ContextTreeNode extends ImmutableTree.Node {

    public readonly faIcon
    public readonly name

    constructor({ id, children, name, faIcon }: { id: string, children: Array<ContextTreeNode>, name: string, faIcon: string }) {
        super({ id, children })
        this.name = name
        this.faIcon = faIcon
    }

    execute(state: ContextMenuState, { event }: { event: MouseEvent }) { }
}

export class ContextRootNode extends ContextTreeNode {

    constructor({ children }: { children: Array<ContextTreeNode> }) {
        super({ id: 'root', children, name: 'menu list', faIcon: '' })
    }

}

export class AddStoryNode extends ContextTreeNode {

    public readonly explorerState: ExplorerState
    public readonly libraryNode: LibraryNode

    constructor(params: {
        explorerState: ExplorerState,
        libraryNode: LibraryNode
    }) {
        super({
            id: 'add-story',
            children: undefined,
            name: 'new story',
            faIcon: 'fas fa-book-open'
        })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState,
        { event }: { event: MouseEvent }
    ) {
        Client.putStory$().subscribe((story: Story) => {
            let storyNode = new StoryNode({ story })
            console.log("Add node", storyNode)
            this.explorerState.addChild(this.libraryNode, storyNode)
        })
        console.log("Create new story")
    }
}


export class AddDocumentNode extends ContextTreeNode {

    public readonly explorerState: ExplorerState
    public readonly parentNode: DocumentNode | StoryNode

    constructor(params: {
        explorerState: ExplorerState,
        parentNode: DocumentNode
    }) {
        super({
            id: 'add-story',
            children: undefined,
            name: 'new document',
            faIcon: 'fas fa-file'
        })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState,
        { event }: { event: MouseEvent }
    ) {
        let body = this.parentNode instanceof StoryNode
            ? {
                parentDocumentId: this.parentNode.story.storyId,
                title: "New document",
                content: ""
            }
            : {
                parentDocumentId: this.parentNode.document.documentId,
                title: "New document",
                content: ""
            }
        Client.putDocument$(
            this.parentNode.story.storyId,
            body
        )
            .subscribe((document: Document) => {
                let childNode = new DocumentNode({ story: this.parentNode.story, document })
                console.log("Add node", childNode)
                this.explorerState.addChild(this.parentNode, childNode)
            })
    }
}


export class RenameDocumentNode extends ContextTreeNode {

    public readonly explorerState: ExplorerState
    public readonly node: DocumentNode

    constructor(params: {
        explorerState: ExplorerState,
        node: StoryNode
    }) {
        super({ id: 'delete-story', children: undefined, name: 'rename document', faIcon: 'fas fa-pen' })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState,
        { event }: { event: MouseEvent }
    ) {
        let document = this.node.document

        let body = {
            documentId: document.documentId,
            title: "Renamed document!"
        }
        Client.postDocument$(document.documentId, body)
            .subscribe((document: Document) => {
                let newNode = new DocumentNode({ ...this.node, document })
                console.log("Add node", { node: this.node, newNode})
                this.explorerState.replaceNode(this.node, newNode)
            })
    }
}


export class DeleteStoryNode extends ContextTreeNode {

    public readonly explorerState: ExplorerState
    public readonly deletedNode: StoryNode

    constructor(params: {
        explorerState: ExplorerState,
        deletedNode: StoryNode
    }) {
        super({ id: 'delete-story', children: undefined, name: 'delete story', faIcon: 'fas fa-trash' })
        Object.assign(this, params)
    }

    execute(
        state: ContextMenuState,
        { event }: { event: MouseEvent }
    ) {
    }
}