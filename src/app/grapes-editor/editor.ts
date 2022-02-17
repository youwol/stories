import * as grapesjs from 'grapesjs'
import { Observable, Subject } from 'rxjs'
import { getBlocks } from './manager-blocks'
import { getStylesSectors } from './manager-style'

const config = {
    autorender: false,
    container: '#gjs',
    canvas: {
        styles: [],
        scripts: [],
    },
    height: '100%',
    width: 'auto',
    panels: { defaults: [] },
    assetManager: {
        assets: [],
        autoAdd: 1,
    },
    keymaps: {
        defaults: {},
    },
    commands: {
        defaults: [],
    },
    selectorManager: {
        appendTo: '#styles',
    },
    blockManager: {
        appendTo: '#blocks',
        blocks: getBlocks(),
    },
    styleManager: {
        appendTo: '#styles',
        sectors: getStylesSectors(),
    },
    layerManager: { appendTo: '#layers' },
    traitManager: { appendTo: '#traits' },
}

export function createGrapesEditor$(): Observable<grapesjs.Editor> {
    localStorage.setItem('gjs-components', '')
    localStorage.setItem('gjs-html', '')
    localStorage.setItem('gjs-css', '')
    localStorage.setItem('gjs-styles', '')

    const editor$ = new Subject<grapesjs.Editor>()

    const editor = grapesjs.init(config)

    const cssNodes = ['bootstrap', 'fa', 'fv'].map((idCss) => {
        const node = document.getElementById(idCss)
        if (idCss == null) {
            throw Error(`${idCss} css node not found`)
        }
        return node
    })

    editor.on('load', function () {
        const document = editor.Canvas.getDocument() as Document
        const headElement = document.head
        cssNodes.forEach((node) => headElement.appendChild(node.cloneNode()))
        editor$.next(editor)
    })
    editor.SelectorManager.getAll().each((selector) => {
        //selector.set('private', privateClasses.includes(selector.id))
        selector.set('private', true)
    })

    editor.render()
    return editor$
}
