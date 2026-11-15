import { defineConfig } from 'vite'

export default defineConfig(() => {
  const policy = `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`
  return {
    root: 'site',
    base: process.env.BASE_PATH || '/',
    publicDir: process.env.MOJOBOX_DEMO === '1' ? '../.cache/intake-demo/site/public' : 'public',
    plugins: [{
      name: 'mojobox-security-headers', apply: 'build',
      transformIndexHtml() {
        return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head' }]
      },
      generateBundle() {
        const metadataHeaders = ['catalog.json', 'contributors.json', 'release.json', 'rankings.json', 'release-assets.json', 'api/v1/plugins.json']
          .map(name => `${process.env.BASE_PATH || '/'}generated/${name}\n  Cache-Control: no-cache\n`).join('\n')
        this.emitFile({ type: 'asset', fileName: '_headers', source: `/*\n  Content-Security-Policy: ${policy}; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n\n${metadataHeaders}` })
      }
    }],
    build: {
      outDir: process.env.MOJOBOX_DEMO === '1' ? '../dist-demo' : '../dist',
      emptyOutDir: true
    },
  }
})
