import { VirtualDOM } from '@youwol/flux-view'
import { TopBannerView } from './top-banner'
import { ExplorerView } from './explorer.view'
import { AppStateReader } from './app-state'
import { PageView } from './page.view'

export class AppView implements VirtualDOM {
    public readonly state: AppStateReader
    public readonly class = 'd-flex flex-column w-100 h-100'

    public readonly children: Array<VirtualDOM>

    constructor(params: { state: AppStateReader }) {
        Object.assign(this, params)

        this.children = [
            {
                class: 'fv-bg-background',
                children: [new TopBannerView(this.state.topBannerState)],
            },
            {
                class: 'd-flex flex-grow-1',
                style: { minHeight: '0px' },
                children: [
                    new ExplorerView({
                        explorerState: this.state.explorerState,
                    }),
                    new PageView({ appState: this.state }),
                ],
            },
        ]
    }
}
