import { mergeMap, tap } from "rxjs/operators"
import { load$ } from "../app/main-app/app-state"
import { Client } from "../app/client/client"
import { EditorView } from "../app/main-panels/document-editor/editor/editor.view"
import { RenderView } from "../app/main-panels/document-editor/render/render.view"
import { setupMockService } from "../app/utils/mock-service"
import { contentMarkdown } from "./mock-data/test-story-markdown"
import { contentRoot } from "./mock-data/test-story-root"
import { CodeMirror, installMockPackages } from './mock-packages'

setupMockService()

installMockPackages()

let storyId = 'test-story'

test('load story, make sure everything is displayed', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {
        
        // WHEN application is loaded ...
        // THEN - 1 : tree-view with node 'test-story' is displayed
        let storyView = document.getElementById("test-story")
        expect(storyView).toBeTruthy()

        // THEN - 2 : editor view is displayed
        let codeMirrorView = document.getElementById("CodeMirror")
        expect(codeMirrorView).toBeTruthy()

        // AND :it displays 'contentRoot' text
        let innerTextCodeMirror = codeMirrorView.innerHTML
        expect(innerTextCodeMirror.trim()).toEqual(contentRoot.trim())

        // THEN - 3 : render view is displayed
        let renderView = document.getElementById("render-view") as any as RenderView
        expect(renderView).toBeTruthy();
        
        // AND : its content has been processed by 'marked' & 'mathjax'
        renderView.renderState.renderedElement$.subscribe( (element: HTMLDivElement) => {
            let innerHtmlRenderView = element.outerHTML
            let target = `<div is="fv-div" class="w-100 mathjax"><div class="marked"> ${contentRoot} </div></div>`
            expect(innerHtmlRenderView.trim()).toEqual(target.trim())
            done()
        })
    })
})


test('load story, change editor content', (done) => {
    
    let newContent = "New content :)"

    load$(storyId, document.body)
    .subscribe( () => {
        
        let editorView = document.getElementById("editor-view") as any as EditorView
        let editorState = editorView.editorState
        // WHEN the code mirror editor is ready
        editorState.codeMirrorEditor$.pipe(
            tap( (cmEditor: CodeMirror) => {
                // THEN the code mirror editor is available
                expect(cmEditor).toBeTruthy()
                // WHEN its content is changed
                cmEditor.setValue(newContent)
            }),
            // AND the content has been saved
            mergeMap( () => editorState.saved$),
            mergeMap( (saved) =>{
                // THEN the save operation is successful
                expect(saved).toBeTruthy()
                // WHEN the content is retrieved from the database
                return Client.getContent$(storyId,'root-test-story')
            })
        )
        .subscribe((content:string) => {
            // THEN the content is what expected
            expect(content).toEqual(newContent)
            done()
        })
    })
})


test('load story, expand root  node, select a document', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {

        // WHEN application is loaded ...
        // THEN tree-view with node 'test-story' is displayed
        let storyView = document.getElementById("test-story")        
        expect(storyView).toBeTruthy()

        // WHEN the test-story node is expanded
        storyView.dispatchEvent(new Event('click', {bubbles:true}))

        // THEN its children are displayed
        let docViews = Array.from(document.querySelectorAll('.document'))
        expect(docViews.length).toEqual(2)

        // WHEN the first child is expanded (test-story-markdown)
        docViews[0].dispatchEvent(new Event('click', {bubbles:true}))

        // THEN the content of the code mirror editor displayed 'contentMarkdown'
        let innerTextCodeMirror = document.getElementById("CodeMirror").innerHTML
        expect(innerTextCodeMirror.trim()).toEqual(contentMarkdown.trim())

        done()
    })
})
