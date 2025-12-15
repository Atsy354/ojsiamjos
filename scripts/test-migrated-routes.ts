// scripts/test-migrated-routes.ts
import { config } from 'dotenv'

config({ path: '.env.local' })

const BASE_URL = 'http://localhost:3000'

async function testRoutes() {
  console.log('🧪 Testing Migrated API Routes...\n')
  console.log('📍 Base URL:', BASE_URL)
  console.log('⏰ Started:', new Date().toLocaleTimeString())
  console.log('\n' + '='.repeat(80) + '\n')
  
  const routes = [
    { method: 'GET', path: '/api/journals', name: 'List Journals' },
    { method: 'GET', path: '/api/submissions', name: 'List Submissions' },
    { method: 'GET', path: '/api/users', name: 'List Users' },
    { method: 'GET', path: '/api/issues', name: 'List Issues' },
    { method: 'GET', path: '/api/publications', name: 'List Publications' },
    { method: 'GET', path: '/api/reviews', name: 'List Reviews' },
  ]
  
  let passed = 0
  let failed = 0
  
  for (const route of routes) {
    try {
      const startTime = Date.now()
      const response = await fetch(`${BASE_URL}${route.path}`)
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        const count = Array.isArray(data) ? data.length : 'N/A'
        console.log(`✅ ${route.method.padEnd(6)} ${route.path.padEnd(30)} [${response.status}] ${responseTime}ms - ${count} items`)
        passed++
      } else {
        console.log(`❌ ${route.method.padEnd(6)} ${route.path.padEnd(30)} [${response.status}] ${responseTime}ms`)
        failed++
      }
    } catch (error) {
      console.log(`❌ ${route.method.padEnd(6)} ${route.path.padEnd(30)} [ERROR] ${error instanceof Error ? error.message : 'Unknown'}`)
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
  console.log(`\n⏰ Completed: ${new Date().toLocaleTimeString()}`)
  
  process.exit(failed > 0 ? 1 : 0)
}

testRoutes()
