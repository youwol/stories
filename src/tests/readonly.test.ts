
import { installMockPackages } from './mock-packages'
installMockPackages()

import { AppState, load$ } from "../app/main-app/app-state"
import { EditorView } from "../app/main-panels/document-editor/editor/editor.view"
import { setupMockService } from "../app/utils/mock-service"
import { storiesUnitTests } from './mock-data/database'
import { YouwolBannerView } from '@youwol/flux-youwol-essentials'
import { RenderView } from '../app/main-panels/document-editor/render/render.view'
import { ViewMode } from '../app/main-app/top-banner'


setupMockService(storiesUnitTests, true)

let storyId = 'test-story'
AppState.debounceTimeSave = 1



test('load story, ensure readonly ok', (done) => {

    load$(storyId, document.body)
        .subscribe(({ appState }) => {

            // WHEN application is loaded ...

            // EXPECT - 0 : no write permissions (readonly)
            expect(appState.permissions.write).toBeFalsy()

            // EXPECT - 1 : tree-view with node 'test-story' is displayed
            let storyView = document.getElementById("test-story")
            expect(storyView).toBeTruthy()

            // EXPECT - 2 : editor view is not displayed by default in readonly
            let editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeFalsy()

            // EXPECT - 3 : editor view is not displayed by default in readonly
            let renderView = document.getElementById("render-view") as any as RenderView
            expect(renderView).toBeTruthy()

            // EXPECT - 4 : banner is displayed
            let bannerView = document.querySelector(`.${YouwolBannerView.ClassSelector}`)
            expect(bannerView).toBeTruthy()

            // EXPECT - 5 : locked icon is displayed
            let lockedView = bannerView.querySelector(".locked")
            expect(lockedView).toBeTruthy()

            // WHEN trigger edit-only mode
            let customActionsView = document.querySelector(".custom-actions-view")
            let editOnlyView = customActionsView.querySelector(`.${ViewMode.editOnly}`)
            expect(editOnlyView).toBeTruthy()
            editOnlyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT editor view
            editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeTruthy()
            editorView.codeMirrorEditor$.subscribe((editor) => {

                expect(editor.readonly).toBeTruthy()
                done()
            })
        })
})
