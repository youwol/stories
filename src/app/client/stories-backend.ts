import { createObservableFromFetch } from "@youwol/flux-core"
import { Observable } from "rxjs"
import { ClientApi } from "./API"


export class StoryBackend implements ClientApi.ServiceInterface {

    static urlBase = "/api/assets-gateway/raw/story"

    getStory$(assetId: string): Observable<ClientApi.Story> {

        return createObservableFromFetch(
            new Request(`${StoryBackend.urlBase}/${assetId}`)
        )
    }

    getChildren$(storyId: string, parentDocumentId: string, fromIndex: number, count: number): Observable<{ documents: ClientApi.Document[] }> {

        return createObservableFromFetch(
            new Request(
                `${StoryBackend.urlBase}/${storyId}/documents/${parentDocumentId}/children?from-index=${fromIndex}&count=${count}`
            ))
    }

    putDocument$(storyId: string, body: { parentDocumentId: string; title: string; content: string; }): Observable<ClientApi.Document> {

        return createObservableFromFetch(
            new Request(
                `${StoryBackend.urlBase}/${storyId}/documents`,
                {
                    method: 'POST',
                    body: JSON.stringify(body)
                }))
    }

    postDocument$(storyId: string, documentId: string, body: { title: string; }): Observable<ClientApi.Document> {

        return createObservableFromFetch(
            new Request(
                `${StoryBackend.urlBase}/${storyId}/documents/${documentId}`,
                {
                    method: 'POST',
                    body: JSON.stringify(body)
                }))
    }

    deleteDocument$(storyId: string, documentId: string) {

        return createObservableFromFetch(
            new Request(
                `${StoryBackend.urlBase}/${storyId}/documents/${documentId}/delete`,
                {
                    method: 'POST'
                }))
    }

    getContent$(storyId: string, documentId: string): Observable<string> {

        return createObservableFromFetch(
            new Request(
                `${StoryBackend.urlBase}/${storyId}/contents/${documentId}`
            ))
    }

    postContent$(storyId: string, documentId: string, body: { content: string }): Observable<boolean> {

        return createObservableFromFetch(
            new Request(
                `${StoryBackend.urlBase}/${storyId}/contents/${documentId}`,
                {
                    method: 'POST',
                    body: JSON.stringify(body)
                }))
    }

    putStory$(body: { authors: string[]; title: string; }): Observable<ClientApi.Story> {
        throw new Error("Method not implemented.");
    }

    postStory$(storyId: string, body: { title: string; }): Observable<ClientApi.Story> {
        throw new Error("Method not implemented.");
    }

    getDocument$(storyId: string, documentId: string): Observable<ClientApi.Document> {
        throw new Error("Method not implemented.");
    }
}
