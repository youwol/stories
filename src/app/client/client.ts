import { Observable } from "rxjs";
import * as _ from 'lodash'
import { MockService } from "./mock-client";
import { ClientApi } from "./client-models";
import { map } from "rxjs/operators";



export class Author implements ClientApi.Author{

    authorId: string

    constructor({authorId} : ClientApi.Author){
        this.authorId = authorId
    }
}


export class DocumentReference implements ClientApi.DocumentReference{

    documentId: string
    title: string

    constructor({documentId, title}){
        this.documentId = documentId
        this.title = title
    }
}

export class Document implements ClientApi.Document{

    documentId: string
    title: string
    contentId: string
    children: DocumentReference[]    

    constructor({documentId, title, contentId, children}: ClientApi.Document){
        this.documentId = documentId
        this.title = title
        this.contentId = contentId
        this.children = children.map( (ref) => new DocumentReference(ref))
    }
}

export class Story implements ClientApi.Story{

    storyId: string
    rootDocument: DocumentReference
    authors: Author[]

    constructor({storyId, rootDocument, authors}: ClientApi.Story){
        this.storyId = storyId
        this.rootDocument = new DocumentReference(rootDocument)
        this.authors = authors.map( (author) => new Author(author))
    }
}

export class Client{

    static basePath = "/api/assets-gateway/raw/stories"
 
    
    static getStories$() : Observable<Story[]>{

        return MockService.getStories$().pipe(
            map( (stories) => {
                return stories.map( story => new Story(story))
            })
        )
    }

    static getStory$( assetId: string) : Observable<Story>{

        return MockService.getStory$(assetId).pipe(
            map( (story) => {
                return new Story(story)
            })
        )
    }

    static putStory$() : Observable<Story>{

        return MockService.putStory$().pipe(
            map( (story) => {
                return new Story(story)
            })
        )
    }


    static getDocument$( assetId: string, documentId: string ) : Observable<Document> {

        return MockService.getDocument$(assetId, documentId).pipe(
            map( (document) => {
                return new Document(document)
            })
        )
    }

    static putDocument$(
        assetId: string, 
        body: { parentDocumentId: string, title: string, content: string}
        ) : Observable<Document>{

        return MockService.putDocument$(assetId, body).pipe(
            map( (document) => {
                return new Document(document)
            })
        )
    }

    static postDocument$(
        assetId: string, 
        body: { documentId: string, title: string}
        ) : Observable<Document>{

        return MockService.postDocument$(assetId, body).pipe(
            map( (document) => {
                return new Document(document)
            })
        )
    }


    static getContent$(assetId: string, documentId: string) : Observable<string> {

        return MockService.getContent$(assetId, documentId)
    }

    static postContent$(documentId: string, content: string) {
        return MockService.postContent$(documentId, content)
    }
}