
export const npmrcContent = `registry=https://registry.npmjs.org/\n`

export const npmignoreContent = `# source
**/*.ts
*.ts

# definitions
!**/*.d.ts
!*.d.ts

# configuration
package-lock.json
tslint.json
tsconfig.json
.prettierrc

*.tsbuildinfo

## dependencies
node_modules/\n
`

export const workspaceNpmrcContent = `auto-install-peers = true
lockfile = true
link-workspace-packages = true
provenance = true
save-exact = true
strict-peer-dependencies = false
tag-version-prefix=""\n`
