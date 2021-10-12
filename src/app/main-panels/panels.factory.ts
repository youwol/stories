import { VirtualDOM } from "@youwol/flux-view";
import { AppState } from "../main-app/app-state";
import { DocumentNode, ExplorerNode, StoryNode } from '../explorer/nodes'
import { DocumentEditorView } from "./document-editor/document-editor.view";

/**
 * Creates the main-panel view of a selected node in the story's explorer.
 * 
 * @param { node, appState, classes, style }:
 * -    node : selected node in the explorer view
 * -    appState : application state
 * -    classes : classes that will be forwarded to the wrapper DOM's 
 * -    style : style that will be forwarded to the wrapper DOM's
 * @returns The corresponding view
 */
export function panelsFactory( { node, appState, classes, style } : {
    node: ExplorerNode, 
    appState: AppState,
    classes: string,
    style
}) : VirtualDOM{

    let panel = undefined

    if( node instanceof StoryNode ){
        let documentNode = new DocumentNode({story: node.story,document: node.rootDocument})
        panel =  new DocumentEditorView({node: documentNode, appState})
    }

    if( node instanceof DocumentNode ){
        panel =  new DocumentEditorView({node, appState})
    }
    panel.class += " "+classes
    panel.style = style
    return panel
}