import { child$, VirtualDOM, render } from "@youwol/flux-view";
import { ReplaySubject, forkJoin } from "rxjs";
import { Story, Document, Client } from "../client/client";
import { ExplorerView } from "../explorer/explorer.view";
import { ExplorerNode } from "../explorer/nodes";
import { panelsFactory } from "../main-panels/panels.factory";
import { topBannerView } from "../top-banner/top-banner.view";
import { distinctUntilChanged, map, tap } from "rxjs/operators"

/**
 * 
 * @param storyId id of the story to load
 * @param container where to insert the main view
 * @returns {appState, appView} :
 * -    appState application state 
 * -    appView application view
 */
export function load$(storyId: string, container: HTMLElement) {
    container.innerHTML = ""
    
    return forkJoin([
        Client.getStory$(storyId),
        Client.getChildren$(storyId, {parentDocumentId: storyId, count:1}).pipe(
            map( docs => docs[0])
        )]).pipe(
        map(([story, rootDocument]:[story:Story, rootDocument: Document]) => {
            let appState = new AppState({story, rootDocument})
            let appView = new AppView({state: appState})
            return {appState, appView}
        }),
        tap( ({appView}) => container.appendChild(render(appView)))
    )
}

/**
 * Global application state, logic side of [[AppView]]
 */
export class AppState{

    selectedNode$ = new ReplaySubject<ExplorerNode>(1)
    story: Story
    rootDocument: Document

    constructor(params: {
        story: Story,
        rootDocument: Document
    }){
        Object.assign(this, params)
    }
}

/**
 * Global application's view
 */
export class AppView implements VirtualDOM{

    state: AppState
    class = 'fv-bg-background fv-text-primary d-flex flex-column w-100 h-100'
    
    children : Array<VirtualDOM>
    constructor(params: {state:AppState}){

        Object.assign(this, params)

        this.children = [
            topBannerView(),
            {
                class: "d-flex flex-grow-1",
                style: { minHeight: '0px' },
                children: [
                    new ExplorerView({ appState: this.state }),
                    child$(
                        this.state.selectedNode$.pipe(
                            distinctUntilChanged()
                        ),
                        (node: ExplorerNode) => panelsFactory({
                            node,
                            appState: this.state,
                            classes: "flex-grow-1",
                            style: {
                                minWidth: '0%'
                            }
                        }),
                        {
                            untilFirst: {
                                class: "h-100 w-100 fv-bg-background-alt"
                            } as any
                        }
                    )
                ]
            }
        ]
    }
}