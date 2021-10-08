require('./style.css');

import { child$, render } from '@youwol/flux-view';
import { AppState } from './app-state';
import { Node } from './explorer/nodes';
import { ExplorerView } from './explorer/explorer.view';
import { topBannerView } from './top-banner/top-banner.view';
import { panelsFactory } from './main-panels/panels.factory';

let appState = new AppState()

let vDOM = {
    class:'fv-bg-background fv-text-primary d-flex flex-column w-100 h-100',
    children:[
        topBannerView(),
        {
            class:"h-100 d-flex flex-grow-1",
            children:[
                new ExplorerView({appState}),
                child$(
                    appState.selectedNode$,
                    (node: Node) => {
                        return panelsFactory(node, appState)
                    },
                    {
                        untilFirst: {
                            class:"h-100 w-100 fv-bg-background-alt"
                        } as any
                    }
                )
            ]
        }
    ]
}

document.getElementById("content").appendChild(render(vDOM))
