export function getBlocks() {
    return [
        {
            id: 'section',
            label: '<b>Section</b>',
            category: 'Basic',
            attributes: { class: 'gjs-block-section' },
            content: `<section>
        <h1>This is a simple title</h1>
        <div>This is just a Lorem text: Lorem ipsum dolor sit amet</div>
      </section>`,
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-h1p')
            },
        },
        {
            id: 'text',
            label: 'Text',
            category: 'Basic',
            content: '<div data-gjs-type="text">Insert your text here</div>',
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-text')
            },
        },
        {
            id: 'image',
            label: 'Image',
            category: 'Basic',
            // Select the component once it's dropped
            select: true,
            // You can pass components as a JSON instead of a simple HTML string,
            // in this case we also use a defined component type `image`
            content: { type: 'image' },
            // This triggers `active` event on dropped components and the `image`
            // reacts by opening the AssetManager
            activate: true,
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-image')
            },
        },
        {
            id: 'link',
            label: 'Link',
            category: 'Basic',
            select: true,
            content: {
                type: 'link',
                content: 'Text for the link',
                attributes: { href: '' },
            },
        },
        {
            id: '2-columns',
            label: '2 Columns',
            category: 'Layouts',
            content: `
            <div class='' style='display:flex; width:100%; height:100%; padding:5px' data-gjs-droppable='.fx-row-cell' data-gjs-custom-name='Row'>
              <div class='' style='min-width:50px; width:100%' data-gjs-draggable='.row' 
                data-gjs-resizable='resizerRight' data-gjs-name= 'Cell'></div>
              <div class='' style='min-width:50px; width:100%'  data-gjs-draggable='.row'
                data-gjs-resizable='resizerRight' data-gjs-name= 'Cell' ></div>
            </div>
          `,
            render({ el }: { el: HTMLElement }) {
                el.classList.add('gjs-fonts', 'gjs-f-b2')
            },
        },
    ]
}
