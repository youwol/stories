import { Observable } from 'rxjs'
import { ImmutableTree } from '@youwol/fv-tree'
import { ExplorerNode } from '../common'
import { AssetsGateway } from '@youwol/http-clients'

/**
 * @category Data Structure
 */
export class MetadataMoveCmd {
    constructor(
        public readonly parentId: string,
        public readonly position: number,
    ) {}
}

/**
 * @category HTTP
 */
export class HttpHandler {
    /**
     * @group Immutable Constants
     */
    public readonly storyId: string
    /**
     * @group HTTP
     */
    public readonly storiesClient = new AssetsGateway.AssetsGatewayClient()
        .stories
    /**
     * @group Observables
     */
    public readonly command$: Observable<ImmutableTree.Command<ExplorerNode>[]>

    constructor(params: {
        storyId: string
        command$: Observable<ImmutableTree.Command<ExplorerNode>[]>
    }) {
        Object.assign(this, params)
        this.command$.subscribe((commands) => {
            commands.forEach((c) => {
                const meta = c.metadata as {parentId:string, position:number}
                if (c instanceof ImmutableTree.MoveNodeCommand) {
                    this.moveNode({
                        nodeId: c.movedNode.id,
                        destinationParentId: meta.parentId,
                        position: meta.position,
                    })
                }
            })
        })
    }

    moveNode({
        nodeId,
        destinationParentId,
        position,
    }: {
        nodeId: string
        destinationParentId: string
        position: number
    }) {
        console.log('Move', { nodeId, destinationParentId, position })
        this.storiesClient
            .moveDocument$({
                storyId: this.storyId,
                documentId: nodeId,
                body: {
                    position,
                    parent: destinationParentId,
                },
            })
            .subscribe((resp) => console.log(resp))
    }
}
