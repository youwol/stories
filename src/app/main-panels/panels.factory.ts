import { VirtualDOM } from "@youwol/flux-view";
import { AppState } from "../app-state";
import { DocumentNode, LibraryNode, Node, StoryNode } from '../explorer/nodes'
import { DocumentEditorView } from "./document-editor/document-editor.view";
import { LibraryDashboardView } from "./library-dashboard/library-dashboard.view";


export function panelsFactory(node: Node, appState: AppState) : VirtualDOM{

    if( node instanceof LibraryNode)
        return new LibraryDashboardView({node, appState})

    if( node instanceof StoryNode ){
        let documentNode = new DocumentNode({story: node.story,document: node.story.rootDocument})
        return new DocumentEditorView({node: documentNode, appState})
    }

    if( node instanceof DocumentNode )
        return new DocumentEditorView({node, appState})

    
}