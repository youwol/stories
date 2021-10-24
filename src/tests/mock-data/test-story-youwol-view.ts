export let contentYouwolView = `
## A working example

\`\`\`javascript
//@story-view
return () => {
	let div =  document.createElement('div')
	div.id = 'test-youwol-view'
	div.innerHTML = 'Test YouWol View'
	return div
}
\`\`\`

## With error (missing '}'):

\`\`\`javascript
//@story-view
return () =>  ERROR!
\`\`\`
`
