
import { installMockPackages, CodeMirror } from './mock-packages'
installMockPackages()

import { filter, mergeMap, tap } from "rxjs/operators"
import { AppState, load$, SavingStatus } from "../app/main-app/app-state"
import { Client } from "../app/client/client"
import { EditorView } from "../app/main-panels/document-editor/editor/editor.view"
import { RenderView } from "../app/main-panels/document-editor/render/render.view"
import { setupMockService } from "../app/utils/mock-service"
import { contentRoot } from "./mock-data/test-story-root"
import { contentYouwolView } from "./mock-data/test-story-youwol-view"
import { sanitizeCodeScript } from "../app/main-panels/document-editor/render/renderers"
import { storiesUnitTests } from './mock-data/database'
import { contentMarkdown } from './mock-data/test-story-markdown'


setupMockService(storiesUnitTests)

let storyId = 'test-story'
AppState.debounceTimeSave = 1

test('load story, make sure everything is displayed', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN application is loaded ...
            // EXPECT - 1 : tree-view with node 'test-story' is displayed
            let storyView = document.getElementById("test-story")
            expect(storyView).toBeTruthy()

            // EXPECT - 2 : editor view is displayed
            let editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeTruthy()

            editorView.codeMirrorEditor$.subscribe(() => {
                let codeMirrorView = document.getElementById("CodeMirror")
                expect(codeMirrorView).toBeTruthy()
                // AND :it displays 'contentRoot' text
                let innerTextCodeMirror = codeMirrorView.innerHTML
                expect(innerTextCodeMirror.trim()).toEqual(contentRoot.trim())
            })


            // EXPECT - 3 : render view is displayed
            let renderView = document.getElementById("render-view") as any as RenderView
            expect(renderView).toBeTruthy();

            // AND : its content has been processed by 'marked' & 'mathjax'
            renderView.renderedElement$.subscribe(({ htmlElement }) => {
                // MathJax mock include 'mathjax' in class list 
                expect(htmlElement.classList.contains('mathjax')).toBeTruthy()
                let heading1 = htmlElement.querySelector('h1')
                // Marked is not mocked, 
                expect(heading1).toBeTruthy()
                expect(heading1.innerHTML.trim()).toEqual(contentRoot.replace("#", "").trim())
                done()
            })
        })
})


test('load story, expand root  node, select markdown document', (done) => {

    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN application is loaded ...
            // EXPECT tree-view with node 'test-story' is displayed
            let storyView = document.getElementById("test-story")
            expect(storyView).toBeTruthy()

            // WHEN the test-story node is expanded
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT its children are displayed
            let docViews = Array.from(document.querySelectorAll('.document'))
            expect(docViews.length).toEqual(3)

            // WHEN a child is expanded (contentMarkdown)
            docViews[0].dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT - 1: the content of the code mirror editor displayed 'contentMarkdown'
            let editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeTruthy()

            editorView.codeMirrorEditor$.subscribe(() => {
                let innerTextCodeMirror = document.getElementById("CodeMirror").innerHTML
                expect(sanitizeCodeScript(innerTextCodeMirror).trim()).toEqual(contentMarkdown.trim())
            })

            // EXPECT - 2 the content of the renderer view display the virtual DOM loaded from 'contentMarkdown'
            let renderView = document.getElementById("render-view") as any as RenderView
            renderView.renderedElement$.pipe(
                filter(({ document }) => document.documentId == "test-story-markdown")
            ).subscribe(({ htmlElement }: { htmlElement: HTMLDivElement }) => {
                // The code snippet is included with syntax EditorState
                let codeSnippet = htmlElement.querySelector("code.hljs")
                expect(codeSnippet).toBeTruthy()

                done()
            })
        })
})


test('load story, change editor content', (done) => {

    let newContent = "New content :)"

    load$(storyId, document.body)
        .subscribe(({ appState }) => {

            let editorView = document.getElementById("editor-view") as any as EditorView

            //let editorState = editorView.editorState
            // WHEN the code mirror editor is ready
            let save$ = editorView.codeMirrorEditor$.pipe(
                tap((cmEditor: CodeMirror) => {
                    // EXPECT the code mirror editor is available
                    expect(cmEditor).toBeTruthy()
                    // WHEN its content is changed; this method is only available in the mock
                    cmEditor.changeValue(newContent)
                }),
                mergeMap(() => appState.save$),
                filter(({ status }) => status == SavingStatus.done),
                mergeMap(() => {
                    // WHEN the content is retrieved from the database
                    return Client.getContent$(storyId, 'root-test-story')
                })
            ).subscribe((content: string) => {
                // EXPECT the content is what expected
                expect(content).toEqual(newContent)
                done()
            })
        })
})


test('load story, expand root  node, select a document with flux-views', (done) => {
    RenderView.debounceTime = 0
    load$(storyId, document.body)
        .subscribe(() => {

            // WHEN application is loaded ...
            // EXPECT tree-view with node 'test-story' is displayed
            let storyView = document.getElementById("test-story")
            expect(storyView).toBeTruthy()

            // WHEN the test-story node is expanded
            storyView.dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT its children are displayed
            let docViews = Array.from(document.querySelectorAll('.document'))
            expect(docViews.length).toEqual(3)

            // WHEN a child is expanded (contentYouWol)
            docViews[2].dispatchEvent(new Event('click', { bubbles: true }))

            // EXPECT - 1: the content of the code mirror editor displayed 'contentYouwolView'
            let editorView = document.getElementById("editor-view") as any as EditorView
            expect(editorView).toBeTruthy()

            editorView.codeMirrorEditor$.subscribe(() => {
                let innerTextCodeMirror = document.getElementById("CodeMirror").innerHTML
                expect(sanitizeCodeScript(innerTextCodeMirror).trim()).toEqual(contentYouwolView.trim())
            })

            // EXPECT - 2 the content of the renderer view display the virtual DOM loaded from 'contentYouwolView'
            let renderView = document.getElementById("render-view") as any as RenderView
            renderView.renderedElement$.subscribe(({ document, htmlElement }) => {
                expect(document.documentId).toEqual('test-story-youwol-view')
                // There is one correctly formatted code
                let youwolView = htmlElement.querySelector("#test-youwol-view")
                expect(youwolView).toBeTruthy()
                expect(youwolView.innerHTML).toEqual("Test YouWol View")

                // And another one with error
                let errorView = htmlElement.querySelector(".youwol-view-error")
                expect(errorView).toBeTruthy()

                done()
            })
        })
})

