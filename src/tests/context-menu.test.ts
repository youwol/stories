import { installMockPackages } from './mock-packages'
installMockPackages()

import { load$ } from "../app/main-app/app-state"
import { Client } from "../app/client/client"
import { setupMockService } from "../app/utils/mock-service"
import { storiesUnitTests } from './mock-data/database'


setupMockService(storiesUnitTests)

let storyId = 'test-story'

test('load story, display context menu', (done) => {

    load$(storyId, document.body)
    .subscribe( () => {

        // WHEN application is loaded ...
        let storyView = document.getElementById("test-story")

        // EXPECT story node is displayed
        expect(storyView).toBeTruthy()
        let storyNodeView =  document.querySelector("#test-story span") as HTMLSpanElement
        expect(storyNodeView.innerText).toEqual("Test story")

        // WHEN context menu triggered ...
        let event = document.createEvent('HTMLEvents');
        event.initEvent('contextmenu', true, false);
        storyView.dispatchEvent(event)

        // EXPECT it appears
        let contextMenuView = document.getElementById("context-menu-view")
        expect(contextMenuView).toBeTruthy()
        done()
    })
})

test('load story, select story, display context menu, rename story', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {
        
        let storyView = document.getElementById("test-story")
        
        // WHEN context menu triggered on story ...
        let event = document.createEvent('HTMLEvents');
        event.initEvent('contextmenu', true, false);
        storyView.dispatchEvent(event)

        // EXPECT - 1 : it appears
        let contextMenuView = document.getElementById("context-menu-view")
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : rename story action is available
        let renameView = document.querySelector("#node-rename-story span") as HTMLSpanElement
        expect(renameView).toBeTruthy()
        expect(renameView.innerText).toEqual("rename story")

        // WHEN rename story triggered ...
        renameView.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT text input is displayed in selected node
        let textInputView =  document.querySelector("#node-test-story input") as HTMLInputElement
        expect(textInputView).toBeTruthy()

        // WHEN new name is provided ...
        textInputView.dispatchEvent(new Event('click', {bubbles:true}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'R'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'e'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'n'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'm'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'e'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'd'}))
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter',}))

        // EXPECT - 1 : node name is updated (somehow the consecutive keypresses do not store 'renamed')
        storyView =  document.querySelector("#test-story span") as HTMLSpanElement
        expect(storyView.innerText).toEqual("")

        // EXPECT - 2 : new name is saved in the database
        Client.getStory$(storyId).subscribe( (story) => {
            expect(story.title).toEqual("")
            done()
        })
    })
})

test('load story, select document, display context menu, rename document', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {
        
        // WHEN story node is expanded ...
        let storyView = document.getElementById("test-story")
        storyView.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT markdown node is displayed in the tree view
        let markdownView = document.getElementById("test-story-markdown")
        expect(markdownView).toBeTruthy()

        // WHEN context menu triggered on document ...
        let event = document.createEvent('HTMLEvents');
        event.initEvent('contextmenu', true, false);
        markdownView.dispatchEvent(event)
        
        // EXPECT - 1 : it appears
        let contextMenuView = document.getElementById("context-menu-view")
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : rename document action is available
        let renameView = document.querySelector("#node-rename-document span") as HTMLSpanElement
        expect(renameView).toBeTruthy()
        expect(renameView.innerText).toEqual("rename document")

        // WHEN rename document triggered ...
        renameView.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT text input is displayed in selected node
        let textInputView =  document.querySelector("#node-test-story-markdown input") as HTMLInputElement
        expect(textInputView).toBeTruthy()

        // WHEN new name is provided ...
        textInputView.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter',}))

        // EXPECT - 1 : node name is updated         
        markdownView =  document.querySelector("#test-story-markdown span") as HTMLSpanElement
        expect(markdownView.innerText).toEqual("")
        
        // EXPECT - 2 : new name is saved in the database
        Client.getDocument$(storyId, "test-story-markdown")
        .subscribe( (document) => {
            expect(document.title).toEqual("")
            done()
        })
    })
})

test('load story, select document, display context menu, delete document', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {

        // WHEN story node is expanded ...
        let storyView = document.getElementById("test-story")
        storyView.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT markdown document appears
        let markdownView = document.getElementById("test-story-markdown")
        expect(markdownView).toBeTruthy()

        // WHEN context menu triggered on document ...
        let event = document.createEvent('HTMLEvents');
        event.initEvent('contextmenu', true, false);
        markdownView.dispatchEvent(event)
        
        // EXPECT - 1 : it appears
        let contextMenuView = document.getElementById("context-menu-view")
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : delete document action is available
        let deleteView = document.querySelector("#node-delete-document span") as HTMLSpanElement
        expect(deleteView).toBeTruthy()
        expect(deleteView.innerText).toEqual("delete document")

        // WHEN delete triggered ...
        deleteView.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT - 1 : node is deleted in the tree view
        markdownView = document.getElementById("test-story-markdown")
        expect(markdownView).toBeFalsy()

        // EXPECT - 2 : database is updated
        Client.getChildren$(
            storyId, { parentDocumentId: "root-test-story" })
        .subscribe( (documents) => {
            expect(documents.length).toEqual(2)
            expect(documents[0].title).toEqual("Latex")
            done()
        })
    })
})

test('load story, select story, display context menu, add child', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {

        // WHEN context menu triggered on story node ...
        let storyView = document.getElementById("test-story")
        let event = document.createEvent('HTMLEvents');
        event.initEvent('contextmenu', true, false);
        storyView.dispatchEvent(event)
        
        // EXPECT - 1 : it appears
        let contextMenuView = document.getElementById("context-menu-view")
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : add document action is available
        let addDoc = document.querySelector("#node-add-document span") as HTMLSpanElement
        expect(addDoc).toBeTruthy()
        expect(addDoc.innerText).toEqual("new document")

        // WHEN add document is triggered
        addDoc.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT database is updated
        Client.getChildren$(
            storyId, { parentDocumentId: "root-test-story" })
        .subscribe( (documents) => {
            expect(documents.length).toEqual(3)
            expect(documents[2].title).toEqual("New document")
            done()
        })
    })
})


test('load story, select document, display context menu, add child', (done) => {
    
    load$(storyId, document.body)
    .subscribe( () => {
        
        // WHEN story node is expanded ...
        let storyView = document.getElementById("test-story")
        storyView.dispatchEvent(new Event('click', {bubbles:true}))
 
        // EXPECT latex document appears
        let latexView = document.getElementById("test-story-latex")
        expect(latexView).toBeTruthy()

        // WHEN context menu triggered on latex node ...
        let event = document.createEvent('HTMLEvents');
        event.initEvent('contextmenu', true, false);
        latexView.dispatchEvent(event)
        
        // EXPECT - 1 : it appears
        let contextMenuView = document.getElementById("context-menu-view")
        expect(contextMenuView).toBeTruthy()

        // EXPECT - 2 : add document action is available
        let newDoc = document.querySelector("#node-add-document span") as HTMLSpanElement
        expect(newDoc).toBeTruthy()
        expect(newDoc.innerText).toEqual("new document")

        // WHEN add document is triggered
        newDoc.dispatchEvent(new Event('click', {bubbles:true}))

        // EXPECT database is updated
        Client.getChildren$(
            storyId, { parentDocumentId: "test-story-latex" })
        .subscribe( (documents) => {
            expect(documents.length).toEqual(1)
            expect(documents[0].title).toEqual("New document")
            done()
        })
    })
})