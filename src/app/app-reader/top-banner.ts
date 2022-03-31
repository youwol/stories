import { VirtualDOM } from '@youwol/flux-view'
import { TopBanner } from '@youwol/platform-essentials'
import { Permissions } from '../common'

/**
 * Encapsulates the state w/ top banner, see [[BannerActionsView]], [[TopBannerView]]
 */
export class TopBannerState extends TopBanner.YouwolBannerState {
    public readonly permissions: Permissions

    /**
     *
     * @param parameters Constructor's parameters
     * @param parameters.permissions user's permission w/ the story
     */
    constructor(parameters: { permissions: Permissions }) {
        super({})
        Object.assign(this, parameters)
    }
}

/**
 * Main actions exposed in the [[TopBannerView]]
 */
export class BannerActionsView implements VirtualDOM {
    public readonly state: TopBannerState

    public readonly class =
        'd-flex justify-content-around my-auto custom-actions-view'
    public readonly children: VirtualDOM[]

    constructor(params: { state: TopBannerState }) {
        Object.assign(this, params)
        this.children = []
    }
}

/**
 * Top banner of the application
 */
export class TopBannerView extends TopBanner.YouwolBannerView {
    constructor(state: TopBannerState) {
        super({
            state,
            customActionsView: new BannerActionsView({ state }),
            userMenuView: TopBanner.defaultUserMenu(state),
            youwolMenuView: TopBanner.defaultYouWolMenu(state),
        })
    }
}
