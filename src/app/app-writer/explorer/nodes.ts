import { ImmutableTree } from '@youwol/fv-tree'
import { Observable, ReplaySubject } from 'rxjs'
import { map } from 'rxjs/operators'
import { Document, Story } from '../models'
import { AssetsGateway } from '@youwol/http-clients'
import { handleError } from '../utils'

/**
 * Node's signal's type enum
 */
export enum SignalType {
    Rename = 'Rename',
}

/**
 * Node's signal data-structure
 */
interface NodeSignal {
    type: SignalType
}

/**
 * Base class of explorer's node
 */
export abstract class ExplorerNode extends ImmutableTree.Node {
    name: string

    signal$ = new ReplaySubject<NodeSignal>()

    story: Story

    protected constructor({ id, name, children, story }) {
        super({ id, children })
        this.name = name
        this.story = story
    }

    abstract getDocument(): Document
}

/**
 * Story node of explorer's node
 */
export class StoryNode extends ExplorerNode {
    rootDocument: Document

    constructor({
        story,
        rootDocument,
        children,
    }: {
        story: Story
        rootDocument: Document
        children?
    }) {
        super({
            id: rootDocument.documentId,
            story,
            name: story.title,
            children:
                children ||
                getChildrenOfDocument$(story, rootDocument.documentId),
        })
        this.rootDocument = rootDocument
    }

    getDocument() {
        return this.rootDocument
    }
}

/**
 * Document node of explorer's node
 */
export class DocumentNode extends ExplorerNode {
    document: Document

    constructor({
        story,
        document,
        children,
    }: {
        story: Story
        document: Document
        children?
    }) {
        super({
            id: document.documentId,
            story,
            name: document.title,
            children:
                children || getChildrenOfDocument$(story, document.documentId),
        })
        this.document = document
    }

    getDocument() {
        return this.document
    }
}

/**
 *
 * Retrieves document's children
 *
 * @param story associated story
 * @param parentDocumentId parent document id
 * @returns the list of children node
 */
function getChildrenOfDocument$(
    story: Story,
    parentDocumentId: string,
): Observable<DocumentNode[]> {
    return new AssetsGateway.AssetsGatewayClient().raw.story
        .queryDocuments$(story.storyId, parentDocumentId)
        .pipe(
            handleError({ browserContext: 'Get children of document' }),
            map((resp) => {
                return resp.documents.map((document: Document) => {
                    return new DocumentNode({ story, document })
                })
            }),
        )
}
