import { AssetsGateway, StoriesBackend } from '@youwol/http-clients'
import { CssInput, ModulesInput, ScriptsInput } from '@youwol/cdn-client/dist'
import { ReplaySubject } from 'rxjs'
import { ExplorerNode } from './explorer-nodes'

export type Document = StoriesBackend.DocumentResponse
export type Story = StoriesBackend.StoryResponse
export type Permissions = AssetsGateway.PermissionsResp
export type DocumentContent = StoriesBackend.DocumentContentBody

export interface AppStateCommonInterface {
    selectedNode$: ReplaySubject<ExplorerNode>
    story: Story
    selectNode: (node: ExplorerNode) => void
}

export type ContentChangedOrigin = 'editor' | 'loaded'

export interface CodeRequirements {
    modules?: ModulesInput
    scripts?: ScriptsInput
    css?: CssInput
}
