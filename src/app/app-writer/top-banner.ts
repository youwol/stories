import { VirtualDOM } from '@youwol/flux-view'
import { TopBannerView } from '@youwol/os-top-banner'
import { OverallSettings } from './grapes-editor'
import { AppState } from './app-state'

/**
 * Main actions exposed in the [[TopBannerView]]
 *
 * @category View.TopBanner
 */
export class BannerActionsView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class =
        'd-flex justify-content-around my-auto custom-actions-view mx-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.children = [
            new OverallSettings({ state: params.appState.grapesEditorState }),
        ]
    }
}

/**
 * Top banner of the application
 *
 * @category View.TopBanner
 */
export class StoryTopBannerView extends TopBannerView {
    constructor(appState: AppState) {
        super({
            innerView: new BannerActionsView({ appState }),
        })
    }
}
