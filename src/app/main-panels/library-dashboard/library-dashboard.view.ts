import { VirtualDOM } from "@youwol/flux-view";
import { AppState } from "../../app-state";
import { DocumentNode, LibraryNode } from "../../explorer/nodes";


export class LibraryDashboardView implements VirtualDOM{

    class = "d-flex w-100 flex-column justify-content-around"

    children : VirtualDOM[]
    
    public readonly node: DocumentNode
    public readonly appState: AppState

    constructor(params: {
        node: LibraryNode,
        appState: AppState
    }){
        Object.assign(this, params)
        this.children = [
            { 
                style:{
                    fontSize:"xx-large"
                },
                class:"mx-auto fv-text-focus",
                innerText: "Coming soon: recent documents, etc"
            }
        ]
    }
}