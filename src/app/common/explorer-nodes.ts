import { ImmutableTree } from '@youwol/fv-tree'
import { BehaviorSubject, Observable, of, ReplaySubject } from 'rxjs'
import { map, mergeMap, tap } from 'rxjs/operators'
import { Document, Story } from './interfaces'
import { AssetsGateway, StoriesBackend } from '@youwol/http-clients'
import { handleError } from './utils'

/**
 * Node's signal data-structure
 */
export type NodeSignal =
    | 'rename'
    | 'content-changed'
    | 'content-saving'
    | 'children-fetching'

/**
 * Base class of explorer's node
 *
 * @category Explorer's Node
 */
export abstract class ExplorerNode extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly name: string
    /**
     * @group Immutable Constants
     */
    public readonly position: number
    /**
     * @group Observables
     */
    public readonly signal$: ReplaySubject<NodeSignal>
    /**
     * @group Observables
     */
    public readonly processes$ = new BehaviorSubject<
        { id: string; type: NodeSignal }[]
    >([])
    /**
     * @group Immutable Constants
     */
    public readonly story: Story

    protected constructor({ id, name, children, story, signal$, position }) {
        super({ id, children })
        this.name = name
        this.story = story
        this.signal$ = signal$
        this.position = position
    }

    abstract getDocument(): Document

    addProcess(process: { type: NodeSignal; id?: string }) {
        const pid = process.id || `${Math.floor(Math.random() * 1e6)}`
        const runningProcesses = this.processes$
            .getValue()
            .filter((p) => p.id != pid)
        this.processes$.next([
            ...runningProcesses,
            { id: pid, type: process.type },
        ])
        return pid
    }

    removeProcess(id: string) {
        this.processes$.next(
            this.processes$.getValue().filter((p) => p.id != id),
        )
    }
}

/**
 * Story node of explorer's node
 *
 * @category Explorer's Node
 */
export class StoryNode extends ExplorerNode {
    /**
     * @group Immutable Constants
     */
    public readonly rootDocument: Document

    constructor({
        story,
        rootDocument,
        children,
    }: {
        story: Story
        rootDocument: Document
        children?
    }) {
        const signal$ = new ReplaySubject<NodeSignal>(1)
        super({
            id: rootDocument.documentId,
            story,
            position: 0,
            name: story.title,
            signal$,
            children:
                children ||
                getChildrenOfDocument$(
                    story,
                    rootDocument.documentId,
                    () => this,
                ),
        })
        this.rootDocument = rootDocument
    }

    getDocument() {
        return this.rootDocument
    }
}

/**
 * Document node of explorer's node
 *
 * @category Explorer's Node
 */
export class DocumentNode extends ExplorerNode {
    /**
     * @group Immutable Constants
     */
    public readonly document: Document

    constructor({
        story,
        document,
        children,
    }: {
        story: Story
        document: Document
        children?
    }) {
        const signal$ = new ReplaySubject<NodeSignal>(1)
        super({
            id: document.documentId,
            story,
            position: document.position,
            name: document.title,
            signal$,
            children:
                children ||
                getChildrenOfDocument$(story, document.documentId, () => this),
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
 * @param parentNode parent node getter
 * @returns the list of children node
 */
function getChildrenOfDocument$(
    story: Story,
    parentDocumentId: string,
    parentNode: () => ExplorerNode,
): Observable<DocumentNode[]> {
    return of({}).pipe(
        tap(() => {
            parentNode().addProcess({
                type: 'children-fetching',
                id: 'children-fetching',
            })
        }),
        mergeMap(() =>
            new AssetsGateway.AssetsGatewayClient().stories.queryDocuments$({
                storyId: story.storyId,
                parentDocumentId,
            }),
        ),
        handleError({ browserContext: 'Get children of document' }),
        tap((_) => {
            parentNode().removeProcess('children-fetching')
        }),
        map((resp: StoriesBackend.QueryDocumentsResponse) => {
            return resp.documents.map((document: Document) => {
                return new DocumentNode({ story, document })
            })
        }),
    )
}
