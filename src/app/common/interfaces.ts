import { AssetsBackend, StoriesBackend } from '@youwol/http-clients'
import { ReplaySubject } from 'rxjs'
import { ExplorerNode } from './explorer-nodes'

export type Document = StoriesBackend.GetDocumentResponse
export type Story = StoriesBackend.StoryResponse
export type Permissions = AssetsBackend.PermissionsResp
export type DocumentContent = StoriesBackend.DocumentContentBody

export interface AppStateCommonInterface {
    selectedNode$: ReplaySubject<ExplorerNode>
    story: Story
    selectNode: (node: ExplorerNode) => void
}

export type ContentChangedOrigin = 'editor' | 'loaded'

export interface CodeRequirements {
    modules?: string[]
    scripts?: string[]
    css?: string[]
}
