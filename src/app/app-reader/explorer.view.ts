import { AppStateReader } from './app-state'

import { Document, ExplorerNode } from '../common'
import {
    ExplorerBaseState,
    ExplorerBaseView,
    nodeViewElements,
} from '../common/explorer-base.view'
import { VirtualDOM } from '@youwol/flux-view'

/**
 * Logic side of [[ExplorerView]]
 */
export class ExplorerState extends ExplorerBaseState {
    public readonly appState: AppStateReader

    constructor(params: { rootDocument: Document; appState: AppStateReader }) {
        super(params)
    }
}

/**
 * View of a story's tree structure
 */
export class ExplorerView extends ExplorerBaseView {
    constructor(params: { explorerState: ExplorerState }) {
        super({ ...params, headerView })
    }
}

/**
 * Create explorer's node view
 *
 * @param state explorer state
 * @param node node to display
 * @returns the view
 */
function headerView(state: ExplorerBaseState, node: ExplorerNode): VirtualDOM {
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
        ],
    }
}
