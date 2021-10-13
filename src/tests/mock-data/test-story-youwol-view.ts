export let contentYouwolView = `
## A working example

\`\`\`youwol-view
return ({youwol, documentScope}) => ({
	id:'test-youwol-view',
  innerHTML:'Test YouWol View'
})
\`\`\`

## With error (missing '}'):

\`\`\`youwol-view
return ({youwol, documentScope}) => ({
	id:'test-youwol-view'
)
\`\`\`
`