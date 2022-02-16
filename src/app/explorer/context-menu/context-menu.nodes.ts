import { Factory } from '@youwol/flux-core'
import { ImmutableTree } from '@youwol/fv-tree'
import { map, mergeMap } from 'rxjs/operators'
import { popupSelectModuleView$ } from '../../modals/select-module.modal'
import { popupSelectToolboxView$ } from '../../modals/select-toolbox.modal'
import { fetchResources$ } from '../../utils/cdn-fetch'
import { ExplorerState } from '../explorer.view'
import { DocumentNode, ExplorerNode, SignalType, StoryNode } from '../nodes'
import { ContextMenuState } from './context-menu.view'
import { templateFluxModule } from './page-templates/flux-module.template'

/**
 * Factory of available actions in the
 * tree-view's context-menu
 */
export const ALL_ACTIONS = {
    newPage: {
        applicable: (selectedNode) =>
            selectedNode instanceof DocumentNode ||
            selectedNode instanceof StoryNode,
        createNode: (
            documentNode: DocumentNode,
            explorerState: ExplorerState,
        ) =>
            new AddDocumentNode({
                parentNode: documentNode,
                explorerState,
            }),
    },
    deleteDocument: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode,
        createNode: (deletedNode: DocumentNode, explorerState: ExplorerState) =>
            new DeleteDocumentNode({
                deletedNode,
                explorerState,
            }),
    },
    renameStoryNode: {
        applicable: (selectedNode) => selectedNode instanceof StoryNode,
        createNode: (node: StoryNode, explorerState: ExplorerState) =>
            new RenameNode<StoryNode>({
                node,
                explorerState,
            }),
    },
    renameDocumentNode: {
        applicable: (selectedNode) => selectedNode instanceof DocumentNode,
        createNode: (node: DocumentNode, explorerState: ExplorerState) =>
            new RenameNode<DocumentNode>({
                node,
                explorerState,
            }),
    },
    setFromTemplate: {
        applicable: (selectedNode) => selectedNode instanceof StoryNode,
        createNode: (parentNode: StoryNode, explorerState: ExplorerState) =>
            new SetFromTemplateNode({
                parentNode,
                explorerState,
            }),
    },
}

/**
 * Interface of executable nodes of the context menu
 */
export interface ExecutableNode {
    execute(state: ContextMenuState, { event }: { event: MouseEvent })
}

/**
 * Base class of tree-view node of the context menu
 */
export class ContextTreeNode extends ImmutableTree.Node {
    public readonly faIcon
    public readonly name

    constructor({
        id,
        children,
        name,
        faIcon,
    }: {
        id: string
        children: Array<ContextTreeNode>
        name: string
        faIcon: string
    }) {
        super({ id, children })
        this.name = name
        this.faIcon = faIcon
    }
}

/**
 * Type guard against [[ExecutableNode]]
 */
export function isExecutable(
    node: ExecutableNode | ContextTreeNode,
): node is ExecutableNode {
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
        explorerState: ExplorerState
        parentNode: DocumentNode
    }) {
        super({
            id: 'add-document',
            children: [new EmptyDocNode(params), new BrickTemplateNode(params)],
            name: 'new document',
            faIcon: 'fas fa-plus',
        })
        Object.assign(this, params)
    }
}

export class EmptyDocNode extends ContextTreeNode implements ExecutableNode {
    public readonly explorerState: ExplorerState
    public readonly parentNode: DocumentNode | StoryNode

    constructor(params: {
        explorerState: ExplorerState
        parentNode: DocumentNode
    }) {
        super({
            id: 'add-document-empty',
            children: undefined,
            name: 'empty document',
            faIcon: 'fas fa-file',
        })
        Object.assign(this, params)
    }

    execute(state: ContextMenuState) {
        this.explorerState.appState.addDocument(this.parentNode.id, {
            content: '',
            title: 'New document',
        })
    }
}

function addBrickTemplate({
    factory,
    explorerState,
    parentNode,
}: {
    factory: Factory
    explorerState: ExplorerState
    parentNode: ExplorerNode
}) {
    const content = templateFluxModule(factory)
    explorerState.appState.addDocument(parentNode.id, {
        content,
        title: factory.displayName,
    })
}

export class BrickTemplateNode
    extends ContextTreeNode
    implements ExecutableNode
{
    public readonly explorerState: ExplorerState
    public readonly parentNode: DocumentNode | StoryNode

    constructor(params: {
        explorerState: ExplorerState
        parentNode: DocumentNode
    }) {
        super({
            id: 'add-document-template-brick',
            children: undefined,
            name: 'brick template',
            faIcon: 'fas fa-puzzle-piece',
        })
        Object.assign(this, params)
    }

    execute(state: ContextMenuState) {
        popupSelectModuleView$()
            .pipe(
                mergeMap(({ toolboxId, brickId }) => {
                    return fetchResources$({
                        bundles: {
                            [toolboxId]: 'latest',
                        },
                        urlsCss: [],
                        urlsJsAddOn: [],
                    }).pipe(
                        map(() => {
                            return window[toolboxId][brickId]
                        }),
                    )
                }),
            )
            .subscribe((factory: Factory) => {
                addBrickTemplate({
                    factory,
                    explorerState: this.explorerState,
                    parentNode: this.parentNode,
                })
            })
    }
}

export class SetFromTemplateNode extends ContextTreeNode {
    constructor(params: {
        explorerState: ExplorerState
        parentNode: StoryNode
    }) {
        super({
            id: 'set-from-template',
            children: [new SetFromTemplateToolboxNode(params)],
            name: 'Set from template',
            faIcon: 'fas fa-book-open',
        })
        Object.assign(this, params)
    }
}

export class SetFromTemplateToolboxNode
    extends ContextTreeNode
    implements ExecutableNode
{
    explorerState: ExplorerState
    parentNode: StoryNode

    constructor(params: {
        explorerState: ExplorerState
        parentNode: StoryNode
    }) {
        super({
            id: 'set-from-template-toolbox',
            children: undefined,
            name: 'Toolbox',
            faIcon: 'fas fa-toolbox',
        })
        Object.assign(this, params)
    }

    execute(state: ContextMenuState) {
        popupSelectToolboxView$()
            .pipe(
                mergeMap(({ toolboxId }) => {
                    return fetchResources$({
                        bundles: {
                            [toolboxId]: 'latest',
                        },
                        urlsCss: [],
                        urlsJsAddOn: [],
                    }).pipe(
                        map(() => {
                            return window[toolboxId].pack.modules
                        }),
                    )
                }),
            )
            .subscribe((factories: Factory[]) =>
                Object.values(factories).forEach((factory) =>
                    addBrickTemplate({
                        factory,
                        explorerState: this.explorerState,
                        parentNode: this.parentNode,
                    }),
                ),
            )
    }
}

/**
 * Rename document node type of the context-menu's tree-view
 */
export class RenameNode<TNode extends ExplorerNode>
    extends ContextTreeNode
    implements ExecutableNode
{
    public readonly explorerState: ExplorerState
    public readonly node: TNode

    constructor(params: { explorerState: ExplorerState; node: TNode }) {
        super({
            id:
                params.node instanceof DocumentNode
                    ? 'rename-document'
                    : 'rename-story',
            children: undefined,
            name:
                params.node instanceof DocumentNode
                    ? 'rename document'
                    : 'rename story',
            faIcon: 'fas fa-pen',
        })
        Object.assign(this, params)
    }

    execute(state: ContextMenuState) {
        this.node.signal$.next({
            type: SignalType.Rename,
        })
    }
}

/**
 * Delete document node type of the context-menu's tree-view
 */
export class DeleteDocumentNode
    extends ContextTreeNode
    implements ExecutableNode
{
    public readonly explorerState: ExplorerState
    public readonly deletedNode: DocumentNode

    constructor(params: {
        explorerState: ExplorerState
        deletedNode: DocumentNode
    }) {
        super({
            id: 'delete-document',
            children: undefined,
            name: 'delete document',
            faIcon: 'fas fa-trash',
        })
        Object.assign(this, params)
    }

    execute(state: ContextMenuState) {
        this.explorerState.appState.deleteDocument(this.deletedNode.document)
    }
}
