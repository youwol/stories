

export namespace ClientApi{

    export interface Author{

        authorId: string
    }

    export interface DocumentReference{

        documentId: string
        title: string
    }

    export interface Document{

        documentId: string
        title: string
        contentId: string
        children: DocumentReference[]
    }

    export interface Story{

        storyId: string
        rootDocument: DocumentReference
        authors: Author[]
    }
}
