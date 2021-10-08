import { Observable, of } from "rxjs"
import { Story } from "./client"
import { ClientApi } from "./client-models"


function uuid(){
    return ""+Math.floor(Math.random()*1000)
}

let defaultData = {
    stories : {},
    documents : {},
    contents: {}
}


export class MockService {

    static data = localStorage.getItem("stories-storage") 
        ? JSON.parse(localStorage.getItem("stories-storage"))
        : defaultData

    static save(){
        localStorage.setItem("stories-storage", JSON.stringify(MockService.data)) 
    }

    static getStories$() : Observable<ClientApi.Story[]>{

        let stories = Object.values(MockService.data.stories) as ClientApi.Story[]
        console.log("Get stories", stories)
        return of(stories) 
    }
    
    static getStory$( assetId: string) : Observable<ClientApi.Story>{

        if(!MockService.data.stories[assetId]){
            MockService.data.stories[assetId] = {
                storyId: assetId,
                rootDocumentId: assetId,
                authors: []
            }
            let contentId = uuid()
            MockService.data.documents[assetId] = {
                documentId: assetId,
                title: "New story",
                contentId,
                children: []
            }
            MockService.data.contents[contentId] = ""
            return MockService.getStory$(assetId)
        }
        let story = MockService.data.stories[assetId]
        let rootDocument = MockService.data.documents[story.rootDocumentId]
        
        return of({
            storyId: story.storyId,
            rootDocument,
            authors: story.authors
        })
    }

    static putStory$() : Observable<ClientApi.Story> {

        let uid = uuid()
        let story : ClientApi.Story = {
            storyId: uid,
            rootDocument: {
                documentId: uid,
                title: "My new story"
            },
            authors: []
        }
        let document: ClientApi.Document = {
            documentId: uid,
            title: "New page",
            contentId: uid,
            children: []
        }
        let content = ""
        MockService.data.stories[uid] = story
        MockService.data.documents[uid] = document
        MockService.data.contents[uid] = content

        MockService.save()

        return of(story)
    }

    static getDocument$( assetId: string, documentId: string ) : Observable<ClientApi.Document> {

        let document = MockService.data.documents[documentId]
        if(!document){
            console.error({document, assetId, database: MockService.data})
            throw Error("Can not find document") 
        }
        return of(document)
    }


    static getContent$(assetId: string, documentId: string) : Observable<string> {

        return of(MockService.data.contents[documentId])
    }

    static postContent$(documentId: string, content: string) : Observable<boolean>{

        MockService.data.contents[documentId] = content
        MockService.save()
        return of(true)
    }

    static putDocument$(
        assetId: string,
         {parentDocumentId, title, content}: { parentDocumentId: string, title: string, content: string}) :
         Observable<ClientApi.Document> {

        let uid = uuid()
        let doc : ClientApi.Document = {
            title,
            documentId: uid,
            children:[],
            contentId: uid
        }
        MockService.data.documents[parentDocumentId].children.push({documentId: uid, title})
        MockService.data.documents[uid] = doc
        MockService.data.contents[uid] = content
        MockService.save()
        return of(doc)
    }

    static postDocument$(
        assetId: string, 
        body: { documentId: string, title: string}
        ) {

        let id = body.documentId

        let doc : ClientApi.Document = {
            title: body.title,
            documentId: id,
            children:[],
            contentId: id
        }
        MockService.data.documents[id] = doc
        let ref = Object.values(MockService.data.documents).map( (d:any) => d.children ).flat().find( d => d.documentId == body.documentId)
        ref.title = body.title

        MockService.save()
        return of(doc)
    }
}
