import { child$, VirtualDOM } from '@youwol/flux-view'
import { TopBannerView } from './top-banner'
import { AppStateReader } from './app-state'
import { PageView } from './page.view'
import * as Dockable from '../common/dockable-tabs/dockable-tabs.view'

export class AppView implements VirtualDOM {
    public readonly state: AppStateReader
    public readonly class = 'd-flex flex-column w-100 h-100'

    public readonly children: Array<VirtualDOM>

    constructor(params: { state: AppStateReader }) {
        Object.assign(this, params)

        let sideNav = new Dockable.View({
            state: this.state.leftNavState,
            styleOptions: { initialPanelSize: '300px' },
        })

        this.children = [
            {
                class: 'fv-bg-background',
                children: [new TopBannerView(this.state.topBannerState)],
            },
            {
                class: 'd-flex flex-grow-1 overflow-auto',
                style: {
                    position: 'relative',
                    minHeight: '0px',
                },
                children: [
                    child$(sideNav.placeholder$, (d) => d),
                    sideNav,
                    new PageView({ appState: this.state }),
                ],
            },
        ]
    }
}
