import { AssetsGateway } from '@youwol/http-clients'
import { VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject } from 'rxjs'
import { CodeEditorState } from './code-editor/code-editor.view'
import { CssInput, ModulesInput, ScriptsInput } from '@youwol/cdn-client/dist'

export type Document = AssetsGateway.DocumentResponse
export type Story = AssetsGateway.StoryResponse
export type Permissions = AssetsGateway.PermissionsResp
export type DocumentContent = AssetsGateway.DocumentContentBody

export interface Page {
    document: Document
    content: DocumentContent
    originId: ContentChangedOrigin
}

export type ContentChangedOrigin = 'editor' | 'loaded'

export interface CodeRequirements {
    modules?: ModulesInput
    scripts?: ScriptsInput
    css?: CssInput
}
export interface Code {
    headerView: (state: CodeEditorState) => VirtualDOM
    content$: BehaviorSubject<string>
    configuration
    requirements: CodeRequirements
}
