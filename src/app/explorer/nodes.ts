

import {ImmutableTree} from '@youwol/fv-tree'
import { map } from 'rxjs/operators'
import { Client, Story, Document, DocumentReference } from '../client/client'

export class Node extends ImmutableTree.Node{

    name: string

    constructor({id, name, children}){
        super({id, children})
        this.name = name
    }
}

export class LibraryNode extends Node{

    constructor({children} : {children?} = {}){
        super({
            id: 'library', 
            name: 'My library', 
            children: children || getChildrenOfLibrary$()
        })
    }
}

export class StoryNode extends Node{

    story: Story

    constructor({story, children } : {story: Story, children?}){
        super({
            id:story.rootDocument.documentId, 
            name: story.rootDocument.title, 
            children: children || getChildrenOfDocument$(story, story.rootDocument) 
        })
        this.story = story
    }
}

export class DocumentNode extends Node{

    story : Story
    document: DocumentReference

    constructor( {story, document, children} : {
        story: Story, 
        document: DocumentReference,
        children?
    }){
        super({
            id:document.documentId, 
            name: document.title, 
            children: children || getChildrenOfDocument$(story, document) 
        })
        this.story = story
        this.document = document
    }
}


function getChildrenOfLibrary$() {


    return Client.getStories$().pipe(
        map( (stories: Story[]) => {
            return stories.map( (story: Story) => {
                return new StoryNode({story})
            })
        })
    )
}

function getChildrenOfDocument$(story: Story, document: DocumentReference) {


    return Client.getDocument$(story.storyId, document.documentId).pipe(
        map( (document: Document) => {
            return document.children.map( (reference:DocumentReference) => {
                return new DocumentNode({story, document: reference})
            })
        })
    )
}

export function nodesFactory( parentStory: Story, data: Story | DocumentReference ) : Node {

    if( data instanceof Story ){
        return new StoryNode({story: data})
    }
    if( data instanceof DocumentReference ){
        return new DocumentNode({story:parentStory, document:data})
    }
    throw Error("nodesFactory: node's type unknown")
}