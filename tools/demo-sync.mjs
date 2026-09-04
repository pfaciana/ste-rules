// Repo-only dev helper: fill the demo's vendor folder from the working tree,
// so a root test run also runs the demo tests against the current code.
// Wired into the `test` script, before `node --test`, not as a `pretest` hook: npm skips hooks under
// `ignore-scripts`. The copy completes first, so the demo test's `#ste-rules` import always resolves.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const vendor = join(repo, 'demo', 'scripts', 'ste-rules')

rmSync(join(repo, 'demo', 'scripts'), { recursive: true, force: true })

const js = (dir) => readdirSync(join(repo, dir)).filter(f => f.endsWith('.js') && !f.endsWith('.test.js'))

for (const dir of ['.', 'src', 'src/data', 'src/rules']) {
	mkdirSync(join(vendor, dir), { recursive: true })
	for (const f of js(dir)) {
		cpSync(join(repo, dir, f), join(vendor, dir, f))
	}
}
