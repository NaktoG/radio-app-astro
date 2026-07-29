import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const workflowPath = resolve(process.cwd(), '.github/workflows/ci.yml')

function readWorkflow(): string {
  return readFileSync(workflowPath, 'utf8')
}

describe('GitHub Actions CI workflow', () => {
  it('defines a stable Node 22 baseline with reproducible installation', () => {
    const workflow = readWorkflow()

    expect(workflow).toContain('name: CI')
    expect(workflow).toContain('baseline:')
    expect(workflow).toContain('node-version: 22')
    expect(workflow).toContain('cache: npm')
    expect(workflow).toContain('npm ci')
  })

  it('runs the required local quality gates without making E2E required', () => {
    const workflow = readWorkflow()

    expect(workflow).toMatch(/^\s*run: npm run format:check:ci$/m)
    expect(workflow).not.toMatch(/^\s*run: npm run format:check$/m)
    expect(workflow).toContain('npm run lint')
    expect(workflow).toContain('npm run test')
    expect(workflow).toContain('npm run build')
    expect(workflow).not.toContain('npm run test:e2e')
  })

  it('uses safe Supabase placeholders instead of production secrets', () => {
    const workflow = readWorkflow()

    expect(workflow).toContain('SUPABASE_URL: http://localhost:54321')
    expect(workflow).toContain('SUPABASE_SERVICE_ROLE_KEY: ci-placeholder-service-role-key')
    expect(workflow).not.toContain('${{ secrets.SUPABASE_URL }}')
    expect(workflow).not.toContain('${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}')
  })
})
