
import { ContextMenu } from "@youwol/fv-context-menu"
import { fromEvent, Observable, of } from "rxjs"
import { tap } from "rxjs/operators"
import { AppState } from "../../app-state"
import { DocumentNode, LibraryNode, StoryNode } from "../nodes"
import { AddStoryNode, ContextRootNode, ContextTreeNode, DeleteStoryNode, AddDocumentNode, ALL_ACTIONS
 } from "./context-menu.nodes"
import { ImmutableTree } from '@youwol/fv-tree'
import { child$, VirtualDOM } from "@youwol/flux-view"
import { ExplorerState } from "../explorer.view"



export class ContextMenuState extends ContextMenu.State{

    public readonly appState : AppState
    public readonly explorerState: ExplorerState
    public readonly explorerDiv: HTMLDivElement

    constructor({appState, explorerState, explorerDiv} : {
        appState : AppState, 
        explorerState: ExplorerState,
        explorerDiv: HTMLDivElement
    }){
        super( 
            fromEvent(explorerDiv,'contextmenu').pipe(
            tap( (ev:Event)=> ev.preventDefault()) 
        ) as Observable<MouseEvent>
        )
        this.appState = appState
        this.explorerState = explorerState
        this.explorerDiv = explorerDiv
    }

    dispatch(ev: MouseEvent){
        
        
        let view = {
            children: [ 
                child$(
                    this.appState.selectedNode$,
                    (node: Node ) => {
                        let children = Object.values(ALL_ACTIONS)
                        .filter( action => action.applicable(node))
                        .map( action => action.createNode(node as any, this.explorerState))

                        let root = new ContextRootNode({children})
                        let state = new ContextTreeState(root)

                        console.log("Dispatch", node, children)
                        state.selectedNode$.next(root)
                        state.selectedNode$.subscribe( (node) => node.execute(this, {event:ev}))

                        return new ImmutableTree.View(
                            {
                                state, 
                                headerView,
                                class: "fv-bg-background fv-text-primary p-2 rounded border fv-color-primary"
                            }as any)
                    }
                )
            ]
        } 
        return view
    }

}


class ContextTreeState extends ImmutableTree.State<ContextTreeNode>{

    constructor(root:ContextTreeNode ){
        super({rootNode:root, expandedNodes:  [root.id]})
    }
}

function headerView(state:ContextTreeState, node:ContextTreeNode) : VirtualDOM{

    return {
        class: 'd-flex w-100 align-items-baseline fv-pointer fv-hover-bg-background-alt px-1',
        children: [
            { tag: 'i', class: node.faIcon },
            { tag: 'span', class: 'mx-2 w-100', innerText: node.name, style:{'user-select': 'none'}}
        ]
    }
}
