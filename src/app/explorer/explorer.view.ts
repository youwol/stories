import { child$, HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree"
import { filter } from "rxjs/operators";
import { AppState } from "../main-app/app-state";
import { Client, Story, Document } from "../client/client";
import { ContextMenuState } from "./context-menu/context-menu.view";
import { ContextMenu } from '@youwol/fv-context-menu'
import { DocumentNode, ExplorerNode, StoryNode, SignalType } from "./nodes"

/**
 * Logic side of [[ExplorerView]]
 */
export class ExplorerState extends ImmutableTree.State<ExplorerNode>{

    constructor({story, rootDocument, selectedNode$}:{
        story: Story,
        rootDocument: Document
        selectedNode$
    }){
        let rootNode = new StoryNode({story, rootDocument})
        super({
            rootNode,
            selectedNode: selectedNode$,
            expandedNodes:['library']
        })
        selectedNode$.next(rootNode)
    }


    rename( node: DocumentNode | StoryNode, newName: string ){

        if( node instanceof DocumentNode) {

            let document = node.document
            let body = {
                documentId: document.documentId,
                title: newName
            }
            Client.postDocument$(document.storyId, document.documentId, body)
                .subscribe((document: Document) => {
                    this.replaceAttributes(node, { document: document})
                })
        }
        if( node instanceof StoryNode) {
            
            let story = node.story
            let body = {
                storyId: story.storyId,
                title: newName
            }
            Client.postStory$(story.storyId, body)
                .subscribe((story: Story ) => {
                    this.replaceAttributes(node, { story: story})
                })
        }
    }
}

/**
 * View of a story's tree structure
 */
export class ExplorerView extends ImmutableTree.View<ExplorerNode> {
    
    public readonly appState: AppState

    public readonly style = {
        minWidth: '300px'
    }
    public readonly class = 'p-2 border fv-color-primary'

    constructor({appState}: {
        appState: AppState
    }){
        super({
            state: new ExplorerState({
                story: appState.story,
                rootDocument: appState.rootDocument,
                selectedNode$: appState.selectedNode$
            }),
            headerView
        } as any)

        this.appState = appState
        this.connectedCallback = (explorerDiv: HTMLElement$ & HTMLDivElement) => {
            let contextState = new ContextMenuState({
                appState, 
                explorerState: this.state as ExplorerState, 
                explorerDiv
            })
            new ContextMenu.View({state:contextState, class:"fv-bg-background border fv-color-primary"} as any)
        }
    }
}

/**
 * Create renaming node's view
 * 
 * @param node node to rename
 * @param explorerState explorer state
 * @returns the view
 */
function headerRenamed(
    node: DocumentNode | StoryNode, 
    explorerState: ExplorerState
    ) : VirtualDOM {

    return {
        tag: 'input', 
        type: 'text', 
        autofocus: true, 
        style: { 
            zIndex: 200 
        }, 
        class: "mx-2", 
        data: node.name,
        onclick: (ev) => ev.stopPropagation(),
        onkeydown: (ev) => {
            if (ev.key === 'Enter'){
                explorerState.rename(node, ev.target.value)
            }
        }
    }
}

/**
 * Create explorer's node view
 * 
 * @param state explorer state
 * @param node node to display
 * @returns the view
 */
function headerView(
    state:ExplorerState, 
    node: ExplorerNode
    ) : VirtualDOM {

    let faClass = ""
    let id = "" 
    let nodeClass = ""
    if(node instanceof StoryNode){
        faClass = "fas fa-book-open"
        id = node.story.storyId
        nodeClass = "story"
    }
    if(node instanceof DocumentNode){
        faClass = "fas fa-file"
        id = node.document.documentId
        nodeClass = "document"
    }
    
    return {
        id,
        class:`d-flex align-items-center fv-pointer fv-hover-bg-background-alt w-100 ${nodeClass}`,
        children:[
            {
                class:faClass + " px-2",
            },
            child$(
                node.signal$.pipe(
                    filter( (signal) => signal.type == SignalType.Rename )
                ),
                () => {
                    return headerRenamed(node as any, state)
                },
                { untilFirst:  {
                    tag:'span',
                    innerText: node.name
                    } as any
                } 
            )
        ]
    }
}
