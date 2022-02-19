import { AssetsGateway } from '@youwol/http-clients'

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
