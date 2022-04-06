import { Observable } from 'rxjs'
import { ImmutableTree } from '@youwol/fv-tree'
import { ExplorerNode } from '../common'
import { AssetsGateway } from '@youwol/http-clients'

export class MetadataMoveCmd {
    constructor(
        public readonly parentId: string,
        public readonly position: number,
    ) {}
}

export class HttpHandler {
    storyId: string
    storiesClient = new AssetsGateway.AssetsGatewayClient().stories
    command$: Observable<ImmutableTree.Command<ExplorerNode>[]>

    constructor(params: {
        storyId: string
        command$: Observable<ImmutableTree.Command<ExplorerNode>[]>
    }) {
        Object.assign(this, params)
        this.command$.subscribe((commands) => {
            commands.forEach((c) => {
                if (c instanceof ImmutableTree.MoveNodeCommand) {
                    this.moveNode({
                        nodeId: c.movedNode.id,
                        destinationParentId: c.metadata.parentId,
                        position: c.metadata.position,
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
            .moveDocument$(this.storyId, nodeId, {
                position,
                parent: destinationParentId,
            })
            .subscribe((resp) => console.log(resp))
    }
}
