import { HTMLElement$, VirtualDOM } from "@youwol/flux-view";
import {ImmutableTree} from "@youwol/fv-tree"
import { map } from "rxjs/operators";
import { AppState } from "../app-state";
import { Story } from "../client/client";
import { ContextMenuState } from "./context-menu/context-menu.view";
import { ContextMenu } from '@youwol/fv-context-menu'
import {DocumentNode, Node, LibraryNode, StoryNode} from "./nodes"


export class ExplorerState extends ImmutableTree.State<Node>{

    constructor({selectedNode$}:{
        selectedNode$
    }){
        super({
            rootNode: new LibraryNode(),
            selectedNode: selectedNode$,
            expandedNodes:['library']
        })
    }
}


export class ExplorerView extends ImmutableTree.View<Node> {
    
    appState: AppState

    style = {
        minWidth: '300px'
    }
    class = 'p-2 border fv-color-primary'

    constructor({appState}: {
        appState: AppState
    }){
        super({
            state: new ExplorerState({selectedNode$: appState.selectedNode$}),
            headerView
        } as any)

        this.appState = appState
        this.connectedCallback = (explorerDiv: HTMLElement$ & HTMLDivElement) => {
            let contextState = new ContextMenuState( {appState, explorerState:this.state, explorerDiv} )
            new ContextMenu.View({state:contextState, class:"fv-bg-background border fv-color-primary"} as any)
        }
    }
}

function headerView(state:ExplorerState, node: Node) : VirtualDOM {

    let faClass = ""

    if(node instanceof StoryNode){
        faClass = "fas fa-book-open"
    }
    if(node instanceof DocumentNode){
        faClass = "fas fa-file"
    }
    if(node instanceof LibraryNode){
        faClass = "fas fa-barcode"
    }
    return {
        class:'d-flex align-items-center fv-pointer fv-hover-bg-background-alt w-100',
        children:[
            {
                class:faClass + " px-2",
            },
            {
                innerText: node.name
            }
        ]
    }
}