// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/auth/password"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Seed admin user
  const adminPassword = await hashPassword("admin123")
  const admin = await prisma.user.upsert({
    where: { email: "admin@iamjos.org" },
    update: {},
    create: {
      email: "admin@iamjos.org",
      password: adminPassword,
      firstName: "System",
      lastName: "Administrator",
      roles: ["admin"],
      affiliation: "IamJOS Platform",
    },
  })
  console.log("✅ Admin user created:", admin.email)
  console.log("   Password: admin123")

  // Seed sample journal
  const journal = await prisma.journal.upsert({
    where: { path: "jcst" },
    update: {},
    create: {
      path: "jcst",
      name: "Journal of Computer Science and Technology",
      acronym: "JCST",
      description: "A leading journal in computer science and technology research.",
      contactEmail: "editor@jcst.org",
      primaryLocale: "en",
    },
  })
  console.log("✅ Journal created:", journal.name)

  // Seed editor user for journal
  const editorPassword = await hashPassword("editor123")
  const editor = await prisma.user.upsert({
    where: { email: "editor@jcst.org" },
    update: {},
    create: {
      email: "editor@jcst.org",
      password: editorPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      roles: ["editor"],
      affiliation: "MIT - Department of Computer Science",
      journalId: journal.id,
    },
  })
  console.log("✅ Editor user created:", editor.email)
  console.log("   Password: editor123")

  // Seed author user
  const authorPassword = await hashPassword("author123")
  const author = await prisma.user.upsert({
    where: { email: "author@jcst.org" },
    update: {},
    create: {
      email: "author@jcst.org",
      password: authorPassword,
      firstName: "Michael",
      lastName: "Chen",
      roles: ["author"],
      affiliation: "Stanford University - AI Research Lab",
      journalId: journal.id,
    },
  })
  console.log("✅ Author user created:", author.email)
  console.log("   Password: author123")

  // Seed reviewer user
  const reviewerPassword = await hashPassword("reviewer123")
  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@jcst.org" },
    update: {},
    create: {
      email: "reviewer@jcst.org",
      password: reviewerPassword,
      firstName: "Emily",
      lastName: "Davis",
      roles: ["reviewer"],
      affiliation: "Oxford University - Computer Science Department",
      journalId: journal.id,
    },
  })
  console.log("✅ Reviewer user created:", reviewer.email)
  console.log("   Password: reviewer123")

  // Seed additional reviewer
  const reviewer2Password = await hashPassword("reviewer123")
  const reviewer2 = await prisma.user.upsert({
    where: { email: "reviewer2@jcst.org" },
    update: {},
    create: {
      email: "reviewer2@jcst.org",
      password: reviewer2Password,
      firstName: "James",
      lastName: "Wilson",
      roles: ["reviewer"],
      affiliation: "Cambridge University - CS Department",
      journalId: journal.id,
    },
  })
  console.log("✅ Reviewer 2 created:", reviewer2.email)

  // Seed section for journal
  const section = await prisma.section.upsert({
    where: {
      id: `section-${journal.id}-1`,
    },
    update: {},
    create: {
      id: `section-${journal.id}-1`,
      journalId: journal.id,
      title: "Research Articles",
      abbreviation: "RA",
      policy: "Research articles should present original research findings.",
      isActive: true,
      sequence: 0,
    },
  })
  console.log("✅ Section created:", section.title)

  // Seed sample submissions with different statuses
  const now = new Date()
  const submissions = [
    {
      title: "Deep Learning Approaches for Natural Language Processing",
      abstract: "This paper explores advanced deep learning techniques for improving NLP task performance, including transformer architectures and attention mechanisms.",
      keywords: ["deep learning", "NLP", "transformer", "attention"],
      status: "submitted" as const,
      daysAgo: 2,
      authors: [
        { firstName: "Michael", lastName: "Chen", email: author.email, isPrimary: true },
        { firstName: "Lisa", lastName: "Wang", email: "lisa.wang@stanford.edu", isPrimary: false },
      ],
    },
    {
      title: "Machine Learning Applications in Healthcare",
      abstract: "We present a comprehensive survey of machine learning applications in healthcare, focusing on diagnostic tools and predictive analytics.",
      keywords: ["machine learning", "healthcare", "diagnostics", "predictive analytics"],
      status: "under_review" as const,
      daysAgo: 10,
      authors: [
        { firstName: "Michael", lastName: "Chen", email: author.email, isPrimary: true },
      ],
      createReviews: true,
    },
    {
      title: "Blockchain Technology for Secure Data Transactions",
      abstract: "This research investigates the use of blockchain technology to enhance security in data transactions and improve trust in distributed systems.",
      keywords: ["blockchain", "security", "distributed systems", "cryptography"],
      status: "revision_required" as const,
      daysAgo: 25,
      authors: [
        { firstName: "Michael", lastName: "Chen", email: author.email, isPrimary: true },
      ],
      createReviews: true,
      createDecision: true,
    },
    {
      title: "Quantum Computing: Current State and Future Prospects",
      abstract: "An in-depth analysis of quantum computing technologies, current limitations, and potential applications in solving complex computational problems.",
      keywords: ["quantum computing", "quantum algorithms", "computational complexity"],
      status: "accepted" as const,
      daysAgo: 45,
      authors: [
        { firstName: "Michael", lastName: "Chen", email: author.email, isPrimary: true },
      ],
      createReviews: true,
      createDecision: true,
    },
  ]

  console.log("\n📄 Creating sample submissions...")
  for (const [index, subData] of submissions.entries()) {
    const submittedDate = new Date(now.getTime() - subData.daysAgo * 24 * 60 * 60 * 1000)
    
    const submission = await prisma.submission.create({
      data: {
        journalId: journal.id,
        sectionId: section.id,
        title: subData.title,
        abstract: subData.abstract,
        keywords: subData.keywords,
        status: subData.status,
        submitterId: author.id,
        dateSubmitted: submittedDate,
        dateStatusModified: new Date(submittedDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        locale: "en",
        stageId: subData.status === "accepted" ? 4 : subData.status === "under_review" ? 3 : 1,
        currentRound: 1,
        authors: {
          create: subData.authors.map((auth, i) => ({
            firstName: auth.firstName,
            lastName: auth.lastName,
            email: auth.email,
            isPrimary: auth.isPrimary,
            sequence: i,
          })),
        },
      },
    })

    console.log(`  ✅ Submission ${index + 1}: ${submission.title} (${submission.status})`)

    // Create review round if needed
    if (subData.createReviews) {
      const reviewRound = await prisma.reviewRound.create({
        data: {
          submissionId: submission.id,
          round: 1,
          status: subData.status === "under_review" ? "pending" : "reviews_completed",
          dateCreated: new Date(submittedDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      })

      // Create review assignments
      const reviewers = [reviewer, reviewer2]
      for (const rev of reviewers) {
        await prisma.reviewAssignment.create({
          data: {
            submissionId: submission.id,
            reviewRoundId: reviewRound.id,
            reviewerId: rev.id,
            status: subData.status === "under_review" ? "pending" : "completed",
            dateAssigned: new Date(submittedDate.getTime() + 3 * 24 * 60 * 60 * 1000),
            dateDue: new Date(submittedDate.getTime() + 17 * 24 * 60 * 60 * 1000),
            dateConfirmed: subData.status !== "under_review" ? new Date(submittedDate.getTime() + 4 * 24 * 60 * 60 * 1000) : null,
            dateCompleted: subData.status !== "under_review" ? new Date(submittedDate.getTime() + 15 * 24 * 60 * 60 * 1000) : null,
            recommendation: subData.status === "revision_required" ? "major_revisions" : subData.status === "accepted" ? "accept" : null,
            comments: subData.status !== "under_review" ? "Good work, but requires some revisions to strengthen the methodology section." : null,
            commentsToEditor: subData.status !== "under_review" ? "The paper shows promise but needs significant improvements in experimental validation." : null,
            quality: subData.status !== "under_review" ? 4 : null,
          },
        })
      }

      // Create editorial decision if needed
      if (subData.createDecision) {
        await prisma.editorialDecision.create({
          data: {
            submissionId: submission.id,
            reviewRoundId: reviewRound.id,
            editorId: editor.id,
            decision: subData.status === "revision_required" ? "request_revisions" : "accept",
            dateDecided: new Date(submittedDate.getTime() + 18 * 24 * 60 * 60 * 1000),
            comments: subData.status === "revision_required" 
              ? "Please address the reviewer comments and resubmit your revised manuscript."
              : "Congratulations! Your manuscript has been accepted for publication.",
          },
        })
      }
    }

    // Create publication if accepted
    if (subData.status === "accepted") {
      await prisma.publication.create({
        data: {
          submissionId: submission.id,
          title: subData.title,
          abstract: subData.abstract,
          keywords: subData.keywords,
          status: "draft",
          version: 1,
          isCurrentVersion: true,
        },
      })
      console.log(`    ✅ Publication created for submission`)
    }
  }

  // Create sample issue
  const issue = await prisma.issue.create({
    data: {
      journalId: journal.id,
      volume: 15,
      number: 3,
      year: 2024,
      title: "Volume 15, Number 3 - 2024",
      description: "Special Issue on Advanced Computing Technologies",
      isPublished: false,
      isCurrent: true,
    },
  })
  console.log("✅ Sample issue created:", issue.title)

  console.log("\n✨ Seeding completed!")
  console.log("\n📝 Test credentials:")
  console.log("   Admin: admin@iamjos.org / admin123")
  console.log("   Editor: editor@jcst.org / editor123")
  console.log("   Author: author@jcst.org / author123")
  console.log("   Reviewer: reviewer@jcst.org / reviewer123")
  console.log("   Reviewer 2: reviewer2@jcst.org / reviewer123")
  console.log("\n📊 Sample data:")
  console.log("   - 4 submissions with different statuses")
  console.log("   - Review assignments and rounds")
  console.log("   - Editorial decisions")
  console.log("   - 1 sample issue")
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


