import { child$, VirtualDOM } from '@youwol/flux-view'
import { StoryTopBannerView } from './top-banner'
import { AppStateReader } from './app-state'
import { PageView } from './page.view'
import * as Dockable from '../common/dockable-tabs/dockable-tabs.view'
import { setApplicationProperties } from '../common'

/**
 * @category Getting Started
 * @category View
 */
export class AppView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly state: AppStateReader

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column w-100 h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: Array<VirtualDOM>

    constructor(params: { state: AppStateReader }) {
        Object.assign(this, params)

        setApplicationProperties({
            storyId: this.state.story.storyId,
            mode: 'reader',
        })

        let sideNav = new Dockable.View({
            state: this.state.leftNavState,
            styleOptions: { initialPanelSize: '300px' },
        })

        this.children = [
            {
                class: 'fv-bg-background',
                children: [new StoryTopBannerView()],
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
