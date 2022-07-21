import { AppStateReader } from './app-state'

import { Document, ExplorerNode } from '../common'
import {
    ExplorerBaseState,
    ExplorerBaseView,
    nodeViewElements,
} from '../common/explorer-base.view'
import { children$, VirtualDOM } from '@youwol/flux-view'

/**
 * Logic side of [[ExplorerView]]
 *
 * @category State
 */
export class ExplorerState extends ExplorerBaseState {
    /**
     * @group States
     */
    public readonly appState: AppStateReader

    constructor(params: { rootDocument: Document; appState: AppStateReader }) {
        super(params)
    }
}

/**
 * View of a story's tree structure
 *
 * @category View
 */
export class ExplorerView extends ExplorerBaseView {
    constructor(params: { explorerState: ExplorerState }) {
        super({ ...params, headerView })
    }
}

/**
 * Create explorer's node view
 *
 * @param _state explorer state
 * @param node node to display
 * @returns the view
 * @category View
 */
function headerView(_state: ExplorerBaseState, node: ExplorerNode): VirtualDOM {
    const { iconView, headerClasses } = nodeViewElements(node)
    return {
        id: node.id,
        class: headerClasses,
        children: [
            iconView,
            {
                tag: 'span',
                style: { userSelect: 'none' },
                innerText: node.name,
            },
            {
                children: children$(node.processes$, (processes) => {
                    return processes.map((p) => {
                        if (p.type == 'children-fetching') {
                            return {
                                style: { transform: 'scale(0.8)' },
                                class: 'fas fa-spinner fa-spin p-1 ml-auto',
                            }
                        }
                        return {}
                    })
                }),
            },
        ],
    }
}
