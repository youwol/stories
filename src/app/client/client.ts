import { forkJoin, Observable } from "rxjs";
import { ClientApi } from "./API";
import { map } from "rxjs/operators";



export class Author implements ClientApi.Author {

    authorId: string

    constructor({ authorId }: ClientApi.Author) {
        this.authorId = authorId
    }
}


export class Document implements ClientApi.Document {

    storyId: string
    documentId: string
    title: string
    contentId: string
    position: number

    constructor(params: ClientApi.Document) {
        Object.assign(this, params)
    }
}

export class Story implements ClientApi.Story {

    storyId: string
    rootDocumentId: string
    authors: Author[]
    title: string

    constructor({ storyId, title, authors }: ClientApi.Story) {
        this.storyId = storyId
        this.title = title
        this.rootDocumentId = storyId
        this.authors = authors.map((author) => new Author(author))
    }
}


export class Client {

    static service: ClientApi.ServiceInterface

    static getStory$(storyId: string): Observable<{ story: Story, permissions }> {

        return forkJoin([
            Client.service.getStory$(storyId),
            Client.service.getPermissions$(storyId)
        ])
            .pipe(
                map(([story, permissions]) => {
                    return { story: new Story(story), permissions }
                })
            )
    }


    static getDocument$(
        storyId: string,
        documentId: string
    ): Observable<Document> {

        return Client.service.getDocument$(storyId, documentId).pipe(
            map((document) => {
                return new Document(document)
            })
        )
    }

    static putDocument$(
        storyId: string,
        body: { parentDocumentId: string, title: string, content: string }
    ): Observable<Document> {

        return Client.service.putDocument$(storyId, body).pipe(
            map((document) => {
                return new Document(document)
            })
        )
    }

    static postDocument$(
        storyId: string,
        documentId: string,
        body: { title: string }
    ): Observable<Document> {

        return Client.service.postDocument$(storyId, documentId, body).pipe(
            map((document) => {
                return new Document(document)
            })
        )
    }

    static deleteDocument$(
        assetId: string,
        documentId: string
    ): Observable<boolean> {

        return Client.service.deleteDocument$(assetId, documentId)
    }

    static getContent$(storyId: string, documentId: string): Observable<string> {

        return Client.service.getContent$(storyId, documentId)
    }

    static postContent$(storyId: string, documentId: string, body: { content: string }) {
        return Client.service.postContent$(storyId, documentId, body)
    } nodeLoad

    static getChildren$(
        storyId: string,
        body: {
            parentDocumentId: string,
            fromIndex?: number,
            count?: number
        }): Observable<Document[]> {

        let count = body.count || 1000
        let fromIndex = body.fromIndex || 0
        return Client.service.getChildren$(
            storyId,
            body.parentDocumentId,
            fromIndex,
            count
        ).pipe(
            map(({ documents }: { documents: ClientApi.Document[] }) => {
                return documents.map(doc => {
                    return new Document({
                        documentId: doc.documentId,
                        storyId: doc.storyId,
                        title: doc.title,
                        position: doc.position
                    })
                })
            })
        )
    }
}
