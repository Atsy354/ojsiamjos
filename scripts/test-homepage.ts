// scripts/test-homepage.ts
import { config } from 'dotenv'

config({ path: '.env.local' })

const BASE_URL = 'http://localhost:3000'

async function testHomepage() {
    console.log('🧪 Testing Homepage Integration...\n')
    console.log('📍 URL:', BASE_URL)
    console.log('⏰ Started:', new Date().toLocaleTimeString())
    console.log('\n' + '='.repeat(80) + '\n')

    try {
        // Test 1: Homepage loads
        console.log('1️⃣  Testing Homepage Load...')
        const startTime = Date.now()
        const response = await fetch(BASE_URL)
        const responseTime = Date.now() - startTime

        if (!response.ok) {
            console.log(`   ❌ FAIL - Status: ${response.status}`)
            console.log(`   Response: ${response.statusText}`)
            return
        }

        console.log(`   ✅ PASS - Status: ${response.status}`)
        console.log(`   ⏱️  Response Time: ${responseTime}ms`)

        // Test 2: Check HTML content
        console.log('\n2️⃣  Checking HTML Content...')
        const html = await response.text()

        const checks = [
            { name: 'Has <html> tag', test: html.includes('<html') },
            { name: 'Has title', test: html.includes('<title>') },
            { name: 'Has main content', test: html.includes('IamJOS') || html.includes('Journal') },
            { name: 'No build errors', test: !html.includes('Error:') && !html.includes('Module not found') },
            { name: 'Has React hydration', test: html.includes('__NEXT_DATA__') },
        ]

        let passedChecks = 0
        for (const check of checks) {
            if (check.test) {
                console.log(`   ✅ ${check.name}`)
                passedChecks++
            } else {
                console.log(`   ❌ ${check.name}`)
            }
        }

        console.log(`\n   📊 Passed: ${passedChecks}/${checks.length}`)

        // Test 3: Check for specific content
        console.log('\n3️⃣  Checking for Expected Content...')
        const contentChecks = [
            { name: 'Hero section', pattern: /Publish and Discover|Academic Research/i },
            { name: 'Stats section', pattern: /Submissions|Users|Publications/i },
            { name: 'Features section', pattern: /Open Access|Peer Review/i },
            { name: 'CTA section', pattern: /Submit Your Paper|Ready to Share/i },
        ]

        let foundContent = 0
        for (const check of contentChecks) {
            if (check.pattern.test(html)) {
                console.log(`   ✅ ${check.name} found`)
                foundContent++
            } else {
                console.log(`   ⚠️  ${check.name} not found`)
            }
        }

        console.log(`\n   📊 Found: ${foundContent}/${contentChecks.length}`)

        // Summary
        console.log('\n' + '='.repeat(80))
        console.log('\n📊 Test Summary:')
        console.log(`   ✅ Homepage loads: YES`)
        console.log(`   ✅ Response time: ${responseTime}ms`)
        console.log(`   ✅ HTML checks: ${passedChecks}/${checks.length}`)
        console.log(`   ✅ Content checks: ${foundContent}/${contentChecks.length}`)

        const overallSuccess = passedChecks === checks.length && foundContent >= contentChecks.length - 1
        console.log(`\n   ${overallSuccess ? '🎉 OVERALL: PASS' : '⚠️  OVERALL: PARTIAL PASS'}`)

        console.log(`\n⏰ Completed: ${new Date().toLocaleTimeString()}`)

        process.exit(overallSuccess ? 0 : 1)

    } catch (error) {
        console.log('\n❌ ERROR:', error instanceof Error ? error.message : 'Unknown error')
        console.log('\n💡 Possible causes:')
        console.log('   - Dev server not running (run: npm run dev)')
        console.log('   - Port 3000 is blocked')
        console.log('   - Build error preventing server start')
        process.exit(1)
    }
}

testHomepage()
