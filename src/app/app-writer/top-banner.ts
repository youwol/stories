import { VirtualDOM } from '@youwol/flux-view'
import { TopBanner } from '@youwol/platform-essentials'
import { OverallSettings } from './grapes-editor/grapes.view'
import { AppState } from './app-state'

/**
 * Main actions exposed in the [[TopBannerView]]
 */
export class BannerActionsView implements VirtualDOM {
    public readonly class =
        'd-flex justify-content-around my-auto custom-actions-view'
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
 */
export class TopBannerView extends TopBanner.YouwolBannerView {
    constructor(appState: AppState) {
        let state = new TopBanner.YouwolBannerState()
        super({
            state,
            customActionsView: new BannerActionsView({ appState }),
            userMenuView: TopBanner.defaultUserMenu(state),
            youwolMenuView: TopBanner.defaultYouWolMenu(state),
        })
    }
}
