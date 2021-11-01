import { Observable, of } from "rxjs"
import { ClientApi } from "../app/client/API"

/**
 * This namespace describes the data-structures stored
 * in scylla database as well as implements related functions
 */
export namespace ScyllaDb {

    /**
    * primary index : 
    * -    partition_key: storyId
    */
    export interface Story {
        storyId: string
        rootDocumentId: string
        authors: string[]
    }

    /**
     * primary index : 
     * -    partition_key: parentDocumentId, 
     * -    clusteringKey: orderIndex
     * 
     * secondary index : 
     * -    partition_key documentId
     */
    export interface Document {
        documentId: string
        storyId: string //< indirectly gather info on permissions
        title: string,
        parentDocumentId: string
        position: number
        complexityOrder: number
    }

    /**
     * 
     * @param stories stories in the database
     * @param storyId target story's id 
     * @returns target story
     */
    export function getStory(
        stories: Story[],
        storyId: string
    ): Story {

        return stories.find(story => story.storyId == storyId)
    }

    /**
     * 
     * @param documents documents in the database
     * @param query 
     * -    parentDocumentId id of the parent document
     * -    fromIndex starting index (-inf if not provided)
     * -    count expected count (1000 if not provided)
     * @returns
     */
    export function queryDocumentChildren(
        documents: Document[],
        query: {
            parentDocumentId: string,
            fromIndex?: number,
            count?: number
        }
    ) {
        let filtered = documents
            .filter(doc => doc.parentDocumentId == query.parentDocumentId)
            .sort()
        let start = query.fromIndex != undefined
            ? filtered.findIndex(doc => doc.position >= query.fromIndex)
            : 1000
        let end = query.count ? query.count : filtered.length

        return filtered.slice(start, end)
    }

    /**
     * 
     * @param documents documents in the database
     * @param parentDocumentId parent document id
     * @returns last index if exists, undefined otherwise
     */
    export function getLastIndex(
        documents: Document[],
        parentDocumentId: string
    ): number | undefined {
        let filtered = documents
            .filter(doc => doc.parentDocumentId == parentDocumentId)
            .sort()

        return filtered.length == 0 ? undefined : filtered.slice(-1)[0].position
    }
    /**
     * 
     * @param stories stories in the database
     * @param storyId target story's id 
     * @returns target story
     */
    export function getDocument(
        documents: Document[],
        documentId: string
    ): Document {

        return documents.find(doc => doc.documentId == documentId)
    }
}

function uuid() {
    return "" + Math.floor(Math.random() * 1000)
}

/**
 * The mocked databases used by the stories-backend service,
 * in real scenario:
 * -    StoriesDb.stories & StoriesDb.document are tables in scylla-db
 * -    StoriesDb.contents is managed by Minio
 */
interface StoriesDb {
    stories: ScyllaDb.Story[]
    documents: ScyllaDb.Document[],
    contents: { [key: string]: string }
}

/**
 * MockService describes the API of 'stories-backend'.
 * The models are described in [[ClientApi.ServiceInterface]]
 */
export class MockService implements ClientApi.ServiceInterface {

    data: StoriesDb

    persist: (db: StoriesDb) => void

    readonly: boolean
    /**
     * 
     * @param params the parameters:
     * -    data: the data
     * -    persist: if provided it is a callback called after every changes
     * in the database
     */
    constructor(params: {
        readonly: boolean,
        data: StoriesDb,
        persist: (db: StoriesDb) => void
    }) {
        Object.assign(this, params)
    }

    getPermissions$() {
        return of({ write: !this.readonly, read: true })
    }

    getStory$(storyId: string): Observable<ClientApi.Story> {

        let story = ScyllaDb.getStory(this.data.stories, storyId)
        let rootDocument = ScyllaDb.getDocument(this.data.documents, "root-" + storyId)
        return of({
            storyId: storyId,
            title: rootDocument.title,
            authors: story.authors.map(author => {
                return { authorId: author }
            }),
            rootDocumentId: rootDocument.documentId
        })
    }

    putStory$(
        body: {
            authors: string[],
            title: string
        }): Observable<ClientApi.Story> {

        let uid = uuid()
        let story: ScyllaDb.Story = {
            storyId: uid,
            rootDocumentId: "root-" + uid,
            authors: body.authors
        }
        let document: ScyllaDb.Document = {
            documentId: uid,
            storyId: uid,
            title: body.title,
            parentDocumentId: uid,
            position: 0,
            complexityOrder: 0
        }
        let content = ""
        this.data.stories.push(story)
        this.data.documents.push(document)
        this.data.contents[uid] = content

        this.persist(this.data)

        return of({
            storyId: uid,
            title: document.title,
            authors: story.authors.map(author => {
                return { authorId: author }
            }),
            rootDocumentId: uid
        })
    }

    postStory$(
        storyId: string,
        body: {
            title: string,
            authors: string[]
        }
    ): Observable<ClientApi.Story> {

        let docId = "root-" + storyId
        let doc = ScyllaDb.getDocument(this.data.documents, docId)
        let newDoc: ClientApi.Document = {
            ...doc,
            title: body.title
        }
        Object.assign(doc, newDoc)

        let story = ScyllaDb.getStory(this.data.stories, storyId)
        let newStory = {
            ...story,
            title: body.title,
            authors: []
        }
        Object.assign(story, newStory)

        this.persist(this.data)
        return of(newStory)
    }

    getDocument$(storyId: string, documentId: string): Observable<ClientApi.Document> {

        let document = ScyllaDb.getDocument(this.data.documents, documentId)
        return of(document)
    }


    getChildren$(
        storyId: string,
        parentDocumentId: string,
        fromIndex: number = -Infinity,
        count: number = 1000
    ): Observable<{ documents: ClientApi.Document[] }> {


        let documents = ScyllaDb.queryDocumentChildren(
            this.data.documents,
            {
                parentDocumentId,
                fromIndex,
                count
            })
        let children = documents.map((doc) => {
            return {
                title: doc.title,
                storyId: storyId,
                documentId: doc.documentId,
                position: doc.position
            }
        })
        return of({ documents: children })
    }

    putDocument$(
        storyId: string,
        body: {
            parentDocumentId: string,
            title: string,
            content: string
        }): Observable<ClientApi.Document> {

        let uid = uuid()
        let lastIndex = ScyllaDb.getLastIndex(
            this.data.documents,
            body.parentDocumentId
        )
        let doc: ScyllaDb.Document = {
            title: body.title,
            parentDocumentId: body.parentDocumentId,
            documentId: uid,
            storyId,
            position: lastIndex ? lastIndex + 1 : 0,
            complexityOrder: 0
        }
        this.data.documents.push(doc)
        this.data.contents[doc.documentId] = body.content
        this.persist(this.data)

        return of(doc)
    }

    postDocument$(
        storyId: string,
        documentId: string,
        body: {
            title: string,
            content?: string
        }) {

        let original = ScyllaDb.getDocument(
            this.data.documents,
            documentId
        )
        let doc: ScyllaDb.Document = {
            ...original,
            title: body.title
        }
        Object.assign(original, doc)
        if (body.content)
            this.data.contents[documentId] = body.content
        this.persist(this.data)

        return of(doc)
    }

    deleteDocument$(storyId: string, documentId: string) {

        this.data.documents = this.data.documents
            .filter((d: any) => d.documentId != documentId)
        this.persist(this.data)
        return of(true)
    }

    getContent$(storyId: string, documentId: string): Observable<string> {

        return of(this.data.contents[documentId])
    }

    postContent$(storyId: string, documentId: string, body: { content: string }): Observable<boolean> {

        this.data.contents[documentId] = body.content
        this.persist(this.data)
        return of(true)
    }

    getEmojis$(category: string) {

        return of({ emojis: ['😀', '😃', '😄', '😁', '😆', '🤣'] })
    }

}
