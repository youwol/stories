import { Observable } from 'rxjs'

/**
 * This namespace encapsulates the API of the service
 * 'stories-backend'.
 */
export namespace ClientApi {
    /**
     * Permissions on the story
     */
    export interface Permissions {
        read: boolean
        write: boolean
    }

    /**
     * Authors are associated to stories
     */
    export interface Author {
        authorId: string
    }

    /**
     * Document describes a tree structure parent-children
     */
    export interface Document {
        documentId: string
        title: string
        position: number
        storyId: string
    }

    /**
     * Story is a wrapper of root document with metadata.
     */
    export interface Story {
        storyId: string
        rootDocumentId: string
        title: string
        authors: Author[]
    }

    /**
     * Appel Protocol Interface
     */
    export interface ServiceInterface {
        /**
         * Retrieve a story
         *
         * url: GET /stories/{storyId}
         *
         * @param storyId id of the story
         * @returns story
         */
        getStory$(assetId: string): Observable<ClientApi.Story>

        /**
         * Retrieve permissions over a story
         *
         * @param storyId id of the story
         * @returns permission
         */
        getPermissions$(assetId: string): Observable<ClientApi.Permissions>

        /**
         * Create a new story
         *
         * url: PUT /stories
         *
         * @param body body of the request:
         * -    authors: list of authors' id
         * -    title: title of the story
         * @returns story created
         */
        putStory$(body: {
            authors: string[]
            title: string
        }): Observable<ClientApi.Story>

        /**
         * Update a story
         *
         * url: POST /stories/{storyId}
         *
         * @param storyId id of the story
         * @param body body of the request:
         * -    authors: list of authors' id
         * -    title title of the story
         * @returns story created
         */
        postStory$(
            storyId: string,
            body: { title: string },
        ): Observable<ClientApi.Story>

        /**
         * Retrieve a document
         *
         * url: GET /stories/{storyId}/documents/{documentId}
         *
         * @param storyId id of the story
         * @param documentId id of the document
         * @returns document
         */
        getDocument$(
            storyId: string,
            documentId: string,
        ): Observable<ClientApi.Document>

        /**
         * Retrieve children document of parent's document
         *
         * url: GET /stories/{storyId}/documents/{documentId}/children
         *
         * @param storyId id of the story
         * @param parentDocumentId id of the parent document
         * @param fromIndex starting index
         * @param count maximum number of child to return
         * @returns list of children
         */
        getChildren$(
            storyId: string,
            parentDocumentId: string,
            fromIndex: number,
            count: number,
        ): Observable<{ documents: ClientApi.Document[] }>

        /**
         * Create a new document
         *
         * url: PUT /stories/{storyId}/documents
         *
         * @param body body of the request:
         * -    parentDocumentId: id of the parent document
         * -    title: title of the story
         * -    content: content of the document
         * @returns document created
         */
        putDocument$(
            storyId: string,
            {
                parentDocumentId,
                title,
                content,
            }: { parentDocumentId: string; title: string; content: string },
        ): Observable<ClientApi.Document>

        /**
         * Update a document
         *
         * url: POST /stories/{storyId}/documents/{documentId}
         *
         * @param storyId id of the story
         * @param documentId id of the document
         * @param body body of the request:
         * -    title: title of the story
         * @returns document created
         */
        postDocument$(
            storyId: string,
            documentId: string,
            body: { title: string },
        ): Observable<Document>

        /**
         * Delete a document
         *
         * url: DELETE /stories/{storyId}/documents/{documentId}
         *
         * @param storyId id of the story
         * @param documentId id of the document
         * @returns true if no errors
         */
        deleteDocument$(storyId: string, documentId: string)

        /**
         * Retrieve the content of a document
         *
         * url: GET /stories/{storyId}/documents/{documentId}/content
         *
         * @param storyId id of the story
         * @param documentId id of the document
         * @returns the content
         */
        getContent$(storyId: string, documentId: string): Observable<string>

        /**
         * Update the content of a document
         *
         * url: POST /stories/{storyId}/documents/{documentId}/content
         *
         * @param storyId id of the story
         * @param documentId id of the document
         * @param content content
         * @returns
         */
        postContent$(
            storyId: string,
            documentId: string,
            body: { content: string },
        ): Observable<boolean>

        /**
         * Retrieve emojis list
         *
         * @param category category
         */
        getEmojis$(category: string): Observable<{ emojis: string[] }>
    }
}
