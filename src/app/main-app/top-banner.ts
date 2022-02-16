import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, of } from 'rxjs'
import { TopBanner } from '@youwol/platform-essentials'
import { ClientApi } from '../client/API'
import { fetchCodeMirror$ } from '../utils/cdn-fetch'

/**
 * Layout combination between [[RenderView]] &  [[EditorView]]
 */
export enum ViewMode {
    /**
     * Only [[RenderView]] displayed
     */
    renderOnly = 'renderOnly',

    /**
     * Only [[EditorView]] displayed
     */
    editOnly = 'editOnly',

    /**
     * Both [[RenderView]] & [[EditorView]]
     */
    simultaneous = 'simultaneous',
}

/**
 * Encapsulates the state w/ top banner, see [[BannerActionsView]], [[TopBannerView]]
 */
export class TopBannerState extends TopBanner.YouwolBannerState {
    public readonly viewMode$: BehaviorSubject<ViewMode>
    public readonly permissions: ClientApi.Permissions

    /**
     *
     * @param parameters Constructor's parameters
     * @param parameters.permissions user's permission w/ the story
     */
    constructor(parameters: { permissions: ClientApi.Permissions }) {
        super({ cmEditorModule$: fetchCodeMirror$() })
        Object.assign(this, parameters)

        this.viewMode$ = new BehaviorSubject<ViewMode>(
            this.permissions.write
                ? ViewMode.simultaneous
                : ViewMode.renderOnly,
        )
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

    static iconsFactory = {
        [ViewMode.simultaneous]: 'fa-columns',
        [ViewMode.editOnly]: 'fa-pen',
        [ViewMode.renderOnly]: 'fa-eye',
    }

    constructor(params: { state: TopBannerState }) {
        Object.assign(this, params)
        const viewModeCombo = new TopBanner.ComboTogglesView<
            ViewMode,
            TopBannerState
        >({
            selection$: this.state.viewMode$,
            state: this.state,
            values: [
                ViewMode.simultaneous,
                ViewMode.editOnly,
                ViewMode.renderOnly,
            ],
            viewFactory: (mode: ViewMode) => {
                return new TopBanner.FaIconToggleView<ViewMode>({
                    value: mode,
                    selection$: this.state.viewMode$,
                    classes: BannerActionsView.iconsFactory[mode] + ` ${mode}`,
                })
            },
        })

        this.children = [viewModeCombo]
    }
}

/**
 * Top banner of the application
 */
export class TopBannerView extends TopBanner.YouwolBannerView {
    constructor(state: TopBannerState) {
        super({
            state,
            badgesView: new TopBanner.LockerBadge({
                locked$: of(state.permissions.write),
            }),
            customActionsView: new BannerActionsView({ state }),
            userMenuView: TopBanner.defaultUserMenu(state),
            youwolMenuView: TopBanner.defaultYouWolMenu(state),
        })
    }
}
