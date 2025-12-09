// scripts/test-api-routes.ts
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const BASE_URL = 'http://localhost:3000'

interface TestResult {
    route: string
    method: string
    status: 'PASS' | 'FAIL' | 'SKIP'
    statusCode?: number
    error?: string
    responseTime?: number
}

const results: TestResult[] = []

async function testRoute(route: string, method: string = 'GET', body?: any): Promise<TestResult> {
    const startTime = Date.now()

    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        }

        if (body) {
            options.body = JSON.stringify(body)
        }

        const response = await fetch(`${BASE_URL}${route}`, options)
        const responseTime = Date.now() - startTime

        return {
            route,
            method,
            status: response.ok ? 'PASS' : 'FAIL',
            statusCode: response.status,
            responseTime
        }
    } catch (error) {
        return {
            route,
            method,
            status: 'FAIL',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime
        }
    }
}

async function runTests() {
    console.log('🧪 Starting API Route Tests...\n')
    console.log('📍 Base URL:', BASE_URL)
    console.log('⏰ Started at:', new Date().toLocaleTimeString())
    console.log('\n' + '='.repeat(80) + '\n')

    // Test Categories
    const tests = [
        // Public Routes
        {
            category: '📖 Public Routes', routes: [
                { path: '/api/journals', method: 'GET' },
                { path: '/api/issues', method: 'GET' },
                { path: '/api/publications', method: 'GET' },
            ]
        },

        // Auth Routes
        {
            category: '🔐 Authentication', routes: [
                { path: '/api/auth/me', method: 'GET' },
            ]
        },

        // Submissions
        {
            category: '📝 Submissions', routes: [
                { path: '/api/submissions', method: 'GET' },
            ]
        },

        // Reviews
        {
            category: '👥 Reviews', routes: [
                { path: '/api/reviews', method: 'GET' },
                { path: '/api/review/assignments', method: 'GET' },
            ]
        },

        // Editorial
        {
            category: '✏️ Editorial', routes: [
                { path: '/api/editorial/submissions', method: 'GET' },
                { path: '/api/editorial/reviewers', method: 'GET' },
            ]
        },

        // Workflow
        {
            category: '🔄 Workflow', routes: [
                { path: '/api/workflow/discussions', method: 'GET' },
            ]
        },

        // Settings
        {
            category: '⚙️ Settings', routes: [
                { path: '/api/settings', method: 'GET' },
                { path: '/api/settings/emails', method: 'GET' },
            ]
        },

        // Admin
        {
            category: '👑 Admin', routes: [
                { path: '/api/admin/journals', method: 'GET' },
                { path: '/api/admin/site-settings', method: 'GET' },
            ]
        },

        // Stats
        {
            category: '📊 Statistics', routes: [
                { path: '/api/stats/articles', method: 'GET' },
                { path: '/api/stats/monthly', method: 'GET' },
            ]
        },

        // Utilities
        {
            category: '🛠️ Utilities', routes: [
                { path: '/api/notifications', method: 'GET' },
                { path: '/api/event-log', method: 'GET' },
                { path: '/api/email-templates', method: 'GET' },
            ]
        },
    ]

    let totalTests = 0
    let passedTests = 0
    let failedTests = 0

    for (const testGroup of tests) {
        console.log(`\n${testGroup.category}`)
        console.log('-'.repeat(80))

        for (const test of testGroup.routes) {
            const result = await testRoute(test.path, test.method)
            results.push(result)
            totalTests++

            const statusIcon = result.status === 'PASS' ? '✅' : '❌'
            const statusText = result.status === 'PASS' ? 'PASS' : 'FAIL'
            const timeText = result.responseTime ? `${result.responseTime}ms` : 'N/A'

            console.log(`  ${statusIcon} ${test.method.padEnd(6)} ${test.path.padEnd(40)} [${statusText}] ${timeText}`)

            if (result.status === 'PASS') {
                passedTests++
            } else {
                failedTests++
                if (result.error) {
                    console.log(`     ↳ Error: ${result.error}`)
                } else if (result.statusCode) {
                    console.log(`     ↳ Status: ${result.statusCode}`)
                }
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Test Summary:')
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   ✅ Passed: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`)
    console.log(`   ❌ Failed: ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)`)

    const avgResponseTime = results
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length

    console.log(`   ⏱️  Avg Response Time: ${Math.round(avgResponseTime)}ms`)
    console.log(`\n⏰ Completed at: ${new Date().toLocaleTimeString()}`)

    // Exit code
    process.exit(failedTests > 0 ? 1 : 0)
}

// Run tests
runTests().catch(console.error)
