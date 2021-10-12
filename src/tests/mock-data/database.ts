import { ScyllaDb } from "../mock-client"
import { contentLatex } from "./test-story-latex"
import { contentMarkdown } from "./test-story-markdown"
import { contentMarkdownCode } from "./test-story-markdown-code"
import { contentRoot } from "./test-story-root"

export let storiesUnitTests : {
    stories: ScyllaDb.Story[],
    documents: ScyllaDb.Document[],
    contents: {[key:string] : string}
} = {
    stories:[
        { 
            storyId: "test-story",
            authors:['toto@tata.com'],
            rootDocumentId: "root-test-story"
        }
    ],
    documents:[
        { 
            storyId: "test-story",
            documentId: "root-test-story", 
            title: "Test story", 
            orderIndex: 0,
            parentDocumentId: "test-story",
            complexityOrder: 0
        },
        { 
            storyId: "test-story",
            documentId: "test-story-markdown", 
            title: "Markdown", 
            parentDocumentId: "root-test-story",
            orderIndex: 1,
            complexityOrder: 0
        },
        { 
            storyId: "test-story",
            documentId: "test-story-latex", 
            title: "Latex", 
            parentDocumentId: "root-test-story",
            orderIndex: 2,
            complexityOrder: 0
        },
        { 
            storyId: "test-story",
            documentId: "test-story-markdown-code", 
            title: "Code snippets", 
            parentDocumentId: "test-story-markdown",
            orderIndex: 0,
            complexityOrder: 0
        }
    ],
    contents:{
        "root-test-story":  contentRoot,
        "test-story-markdown": contentMarkdown,
        "test-story-latex": contentLatex,
        "test-story-markdown-code": contentMarkdownCode
    }
}
