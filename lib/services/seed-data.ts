// Seed Data - Initial data for development and demo
import type { User, Journal, Section, Issue, Announcement, Submission } from "@/lib/types"

export const seedUsers: Omit<User, "id" | "createdAt">[] = [
  // ============================================
  // PLATFORM LEVEL USERS
  // ============================================
  {
    email: "admin@iamjos.org",
    firstName: "System",
    lastName: "Administrator",
    roles: ["admin", "editor"],
    affiliation: "IamJOS Platform",
    bio: "Platform administrator responsible for system configuration, user management, and overall platform maintenance.",
  },

  // ============================================
  // JCST Managers
  // ============================================
  {
    email: "manager@jcst.org",
    firstName: "Journal",
    lastName: "Manager",
    roles: ["manager"],
    affiliation: "JCST Editorial Office",
    journalId: "jcst",
  },

  // ============================================
  // JCST - Journal of Computer Science and Technology
  // ============================================
  {
    email: "editor@jcst.org",
    firstName: "Sarah",
    lastName: "Johnson",
    roles: ["editor", "author"],
    affiliation: "MIT - Department of Computer Science",
    orcid: "0000-0002-1234-5678",
    bio: "Associate Professor of Computer Science at MIT, specializing in machine learning and AI. Editor-in-Chief of JCST.",
    journalId: "jcst",
  },
  {
    email: "author@jcst.org",
    firstName: "Michael",
    lastName: "Chen",
    roles: ["author"],
    affiliation: "Stanford University - AI Research Lab",
    orcid: "0000-0003-9876-5432",
    bio: "PhD researcher focusing on natural language processing and deep learning.",
    journalId: "jcst",
  },
  {
    email: "reviewer@jcst.org",
    firstName: "Emily",
    lastName: "Davis",
    roles: ["reviewer", "author"],
    affiliation: "Oxford University - Computer Science Department",
    orcid: "0000-0001-5678-1234",
    bio: "Senior researcher with expertise in software engineering and distributed systems.",
    journalId: "jcst",
  },
  {
    email: "reviewer2@jcst.org",
    firstName: "Alex",
    lastName: "Thompson",
    roles: ["reviewer"],
    affiliation: "Cambridge University - Computing Laboratory",
    orcid: "0000-0002-3456-7891",
    bio: "Professor specializing in algorithms and computational complexity.",
    journalId: "jcst",
  },

  // ============================================
  // IJMS - International Journal of Medical Sciences
  // ============================================
  {
    email: "manager@ijms.org",
    firstName: "Journal",
    lastName: "Manager",
    roles: ["manager"],
    affiliation: "IJMS Editorial Office",
    journalId: "ijms",
  },
  {
    email: "editor@ijms.org",
    firstName: "Robert",
    lastName: "Martinez",
    roles: ["editor"],
    affiliation: "Johns Hopkins University - School of Medicine",
    orcid: "0000-0002-8765-4321",
    bio: "Professor of Clinical Medicine and Editor of IJMS. Expert in clinical research methodology.",
    journalId: "ijms",
  },
  {
    email: "author@ijms.org",
    firstName: "Anna",
    lastName: "Petrova",
    roles: ["author"],
    affiliation: "Karolinska Institute - Department of Medicine",
    orcid: "0000-0003-4567-8901",
    bio: "Clinical researcher in oncology and immunotherapy.",
    journalId: "ijms",
  },
  {
    email: "reviewer@ijms.org",
    firstName: "James",
    lastName: "Wilson",
    roles: ["reviewer"],
    affiliation: "Mayo Clinic - Research Division",
    orcid: "0000-0002-3456-7890",
    bio: "Senior physician and peer reviewer for medical journals.",
    journalId: "ijms",
  },
  {
    email: "reviewer2@ijms.org",
    firstName: "Linda",
    lastName: "Chen",
    roles: ["reviewer"],
    affiliation: "Cleveland Clinic - Research Institute",
    orcid: "0000-0003-5678-9013",
    bio: "Specialist in clinical trials and medical research methodology.",
    journalId: "ijms",
  },

  // ============================================
  // JEE - Journal of Environmental Engineering
  // ============================================
  {
    email: "manager@jee.org",
    firstName: "Journal",
    lastName: "Manager",
    roles: ["manager"],
    affiliation: "JEE Editorial Office",
    journalId: "jee",
  },
  {
    email: "editor@jee.org",
    firstName: "Maria",
    lastName: "Garcia",
    roles: ["editor", "author"],
    affiliation: "ETH Zurich - Environmental Engineering",
    orcid: "0000-0001-2345-6789",
    bio: "Professor of Environmental Engineering. Expert in sustainable technologies.",
    journalId: "jee",
  },
  {
    email: "author@jee.org",
    firstName: "David",
    lastName: "Kim",
    roles: ["author"],
    affiliation: "Seoul National University - College of Engineering",
    orcid: "0000-0002-6789-1234",
    bio: "Researcher in renewable energy and waste management.",
    journalId: "jee",
  },
  {
    email: "reviewer@jee.org",
    firstName: "Lisa",
    lastName: "Wang",
    roles: ["reviewer", "author"],
    affiliation: "UC Berkeley - Department of Environmental Science",
    orcid: "0000-0003-7890-2345",
    bio: "Associate Professor specializing in climate change and sustainability.",
    journalId: "jee",
  },

  // ============================================
  // JBF - Journal of Business and Finance
  // ============================================
  {
    email: "manager@jbf.org",
    firstName: "Journal",
    lastName: "Manager",
    roles: ["manager"],
    affiliation: "JBF Editorial Office",
    journalId: "jbf",
  },
  {
    email: "editor@jbf.org",
    firstName: "Thomas",
    lastName: "Anderson",
    roles: ["editor"],
    affiliation: "Wharton School of Business - University of Pennsylvania",
    orcid: "0000-0001-3456-7890",
    bio: "Professor of Finance and Editor of JBF. Expert in corporate finance and investments.",
    journalId: "jbf",
  },
  {
    email: "author@jbf.org",
    firstName: "Jennifer",
    lastName: "Brown",
    roles: ["author"],
    affiliation: "Harvard Business School",
    orcid: "0000-0002-4567-8901",
    bio: "Assistant Professor researching fintech and digital transformation.",
    journalId: "jbf",
  },
  {
    email: "reviewer@jbf.org",
    firstName: "Richard",
    lastName: "Lee",
    roles: ["reviewer"],
    affiliation: "London School of Economics",
    orcid: "0000-0003-5678-9012",
    bio: "Senior economist and peer reviewer for finance journals.",
    journalId: "jbf",
  },

  // ============================================
  // JEDU - Journal of Education and Learning
  // ============================================
  {
    email: "manager@jedu.org",
    firstName: "Journal",
    lastName: "Manager",
    roles: ["manager"],
    affiliation: "JEDU Editorial Office",
    journalId: "jedu",
  },
  {
    email: "editor@jedu.org",
    firstName: "Patricia",
    lastName: "Taylor",
    roles: ["editor", "author"],
    affiliation: "Columbia University - Teachers College",
    orcid: "0000-0001-4567-8901",
    bio: "Professor of Education and Editor of JEDU. Expert in curriculum development.",
    journalId: "jedu",
  },
  {
    email: "author@jedu.org",
    firstName: "Kevin",
    lastName: "Nguyen",
    roles: ["author"],
    affiliation: "University of Michigan - School of Education",
    orcid: "0000-0002-5678-9012",
    bio: "PhD candidate researching educational technology and online learning.",
    journalId: "jedu",
  },
  {
    email: "reviewer@jedu.org",
    firstName: "Susan",
    lastName: "Miller",
    roles: ["reviewer", "author"],
    affiliation: "Stanford University - Graduate School of Education",
    orcid: "0000-0003-6789-0123",
    bio: "Associate Professor specializing in assessment and evaluation.",
    journalId: "jedu",
  },

  // ============================================
  // GENERAL READER ACCOUNT
  // ============================================
  {
    email: "reader@iamjos.org",
    firstName: "Guest",
    lastName: "Reader",
    roles: ["reader"],
    affiliation: "General Public",
    bio: "Demo reader account for browsing published content.",
  },
]

export const seedJournals: Omit<Journal, "id" | "createdAt">[] = [
  {
    path: "jcst",
    name: "Journal of Computer Science and Technology",
    acronym: "JCST",
    description:
      "A peer-reviewed journal for computer science research covering algorithms, software engineering, and systems.",
    issn: "1234-5678",
    publisher: "Academic Publishing House",
    contactEmail: "editor@jcst.org",
    primaryLocale: "en",
  },
  {
    path: "ijms",
    name: "International Journal of Medical Sciences",
    acronym: "IJMS",
    description: "Advancing medical research through rigorous peer review and open access publishing.",
    issn: "2345-6789",
    publisher: "Medical Research Publishers",
    contactEmail: "editor@ijms.org",
    primaryLocale: "en",
  },
  {
    path: "jee",
    name: "Journal of Environmental Engineering",
    acronym: "JEE",
    description: "Publishing cutting-edge research in environmental science and sustainable engineering.",
    issn: "3456-7890",
    publisher: "Green Science Press",
    contactEmail: "editor@jee.org",
    primaryLocale: "en",
  },
  {
    path: "jbf",
    name: "Journal of Business and Finance",
    acronym: "JBF",
    description: "Premier journal for business administration, finance, and economic research.",
    issn: "4567-8901",
    publisher: "Business Research Institute",
    contactEmail: "editor@jbf.org",
    primaryLocale: "en",
  },
  {
    path: "jedu",
    name: "Journal of Education and Learning",
    acronym: "JEDU",
    description: "Dedicated to advancing educational research and innovative teaching methodologies.",
    issn: "5678-9012",
    publisher: "Education Research Press",
    contactEmail: "editor@jedu.org",
    primaryLocale: "en",
  },
]

export function createSeedSections(journalId: string): Omit<Section, "id">[] {
  return [
    {
      journalId,
      title: "Research Articles",
      abbreviation: "RA",
      policy: "Original research contributions",
      isActive: true,
      sequence: 1,
    },
    {
      journalId,
      title: "Review Articles",
      abbreviation: "REV",
      policy: "Comprehensive literature reviews",
      isActive: true,
      sequence: 2,
    },
    {
      journalId,
      title: "Short Communications",
      abbreviation: "SC",
      policy: "Brief research findings",
      isActive: true,
      sequence: 3,
    },
  ]
}

export function createSeedIssues(journalId: string): Omit<Issue, "id">[] {
  return [
    {
      journalId,
      volume: 1,
      number: 1,
      year: 2024,
      title: "Inaugural Issue",
      isPublished: true,
      isCurrent: false,
      datePublished: "2024-01-15",
    },
    {
      journalId,
      volume: 1,
      number: 2,
      year: 2024,
      title: "Spring Edition",
      isPublished: true,
      isCurrent: true,
      datePublished: "2024-04-15",
    },
  ]
}

export function createSeedAnnouncement(journalId: string): Omit<Announcement, "id"> {
  return {
    journalId,
    title: "Call for Papers: Special Issue",
    content: "We invite submissions for our upcoming special issue. Deadline: December 31, 2025.",
    datePosted: new Date().toISOString(),
    isActive: true,
  }
}

// ============================================
// WORKFLOW SEED DATA - Demonstrates complete editorial workflow
// ============================================

// Article templates for each journal with different workflow stages
export interface WorkflowArticle {
  title: string
  abstract: string
  keywords: string[]
  status: Submission["status"]
  workflowStage: "new" | "in_review" | "revision" | "decision" | "published"
  reviewerCount: number
  reviewsCompleted: number
  recommendation?: "accept" | "minor_revisions" | "major_revisions" | "resubmit_elsewhere" | "decline"
  daysAgo: number
}

export const workflowArticlesByJournal: Record<string, WorkflowArticle[]> = {
  jcst: [
    // Published article (complete workflow)
    {
      title: "Deep Learning Approaches for Natural Language Understanding",
      abstract:
        "This paper presents novel deep learning architectures for improving natural language understanding tasks including sentiment analysis, named entity recognition, and machine translation.",
      keywords: ["deep learning", "NLP", "transformers", "language models"],
      status: "published",
      workflowStage: "published",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 60,
    },
    // Accepted, waiting for publication
    {
      title: "Efficient Graph Algorithms for Social Network Analysis",
      abstract:
        "We propose optimized graph algorithms for analyzing large-scale social networks with improved time complexity and memory efficiency.",
      keywords: ["graph algorithms", "social networks", "big data", "optimization"],
      status: "accepted",
      workflowStage: "decision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 14,
    },
    // Under review - all reviews completed, awaiting decision
    {
      title: "Security Challenges in IoT: A Comprehensive Survey",
      abstract:
        "A comprehensive review of security vulnerabilities and mitigation strategies in Internet of Things ecosystems covering device, network, and application layers.",
      keywords: ["IoT", "security", "vulnerabilities", "cyber security"],
      status: "under_review",
      workflowStage: "in_review",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "minor_revisions",
      daysAgo: 21,
    },
    // Under review - 1 of 2 reviews completed
    {
      title: "Quantum Computing for Cryptographic Applications",
      abstract:
        "Exploring the implications of quantum computing on current cryptographic systems and proposing quantum-resistant algorithms.",
      keywords: ["quantum computing", "cryptography", "post-quantum", "security"],
      status: "under_review",
      workflowStage: "in_review",
      reviewerCount: 2,
      reviewsCompleted: 1,
      daysAgo: 10,
    },
    // Newly submitted - awaiting reviewer assignment
    {
      title: "Blockchain-Based Decentralized Identity Management",
      abstract:
        "A novel framework for managing digital identities using blockchain technology with enhanced privacy and security features.",
      keywords: ["blockchain", "identity", "decentralized", "privacy"],
      status: "submitted",
      workflowStage: "new",
      reviewerCount: 0,
      reviewsCompleted: 0,
      daysAgo: 3,
    },
    // Revision required - author needs to revise
    {
      title: "Machine Learning for Automated Code Review",
      abstract:
        "Applying machine learning techniques to automate code review processes and identify potential bugs and security vulnerabilities.",
      keywords: ["machine learning", "code review", "automation", "software quality"],
      status: "revision_required",
      workflowStage: "revision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "major_revisions",
      daysAgo: 7,
    },
  ],
  ijms: [
    // Published
    {
      title: "Novel Biomarkers for Early Detection of Alzheimer's Disease",
      abstract:
        "This study identifies promising blood-based biomarkers for early Alzheimer's disease detection with 95% sensitivity and 89% specificity.",
      keywords: ["biomarkers", "Alzheimer's", "early detection", "diagnostics"],
      status: "published",
      workflowStage: "published",
      reviewerCount: 3,
      reviewsCompleted: 3,
      recommendation: "accept",
      daysAgo: 45,
    },
    // Under review
    {
      title: "Telemedicine Adoption During Global Health Crises",
      abstract:
        "Analysis of telemedicine implementation and patient outcomes during pandemic conditions across 50 healthcare facilities.",
      keywords: ["telemedicine", "healthcare", "pandemic", "digital health"],
      status: "under_review",
      workflowStage: "in_review",
      reviewerCount: 2,
      reviewsCompleted: 1,
      daysAgo: 18,
    },
    // Accepted
    {
      title: "CRISPR-Based Gene Therapy: Current Progress and Future Directions",
      abstract:
        "Comprehensive review of CRISPR gene editing applications in treating genetic disorders with focus on clinical trials.",
      keywords: ["CRISPR", "gene therapy", "genetic disorders", "biotechnology"],
      status: "accepted",
      workflowStage: "decision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 28,
    },
    // New submission
    {
      title: "Personalized Cancer Immunotherapy: A Clinical Study",
      abstract:
        "A randomized controlled trial evaluating personalized immunotherapy approaches in advanced cancer patients.",
      keywords: ["cancer", "immunotherapy", "personalized medicine", "clinical trial"],
      status: "submitted",
      workflowStage: "new",
      reviewerCount: 0,
      reviewsCompleted: 0,
      daysAgo: 2,
    },
    // Revision required
    {
      title: "Gut Microbiome and Mental Health: Systematic Review",
      abstract:
        "Systematic review examining the relationship between gut microbiome composition and mental health outcomes.",
      keywords: ["microbiome", "mental health", "gut-brain axis", "systematic review"],
      status: "revision_required",
      workflowStage: "revision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "minor_revisions",
      daysAgo: 5,
    },
  ],
  jee: [
    // Published
    {
      title: "Sustainable Wastewater Treatment Using Constructed Wetlands",
      abstract:
        "Evaluation of constructed wetland systems for cost-effective wastewater treatment in rural communities.",
      keywords: ["wastewater", "wetlands", "sustainability", "water treatment"],
      status: "published",
      workflowStage: "published",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 55,
    },
    // Under review
    {
      title: "Carbon Capture Technologies: Economic and Environmental Assessment",
      abstract:
        "Comprehensive analysis of carbon capture methods and their viability for climate mitigation at industrial scale.",
      keywords: ["carbon capture", "climate change", "emissions", "sustainability"],
      status: "under_review",
      workflowStage: "in_review",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "minor_revisions",
      daysAgo: 15,
    },
    // New submission
    {
      title: "Urban Green Infrastructure for Stormwater Management",
      abstract: "Study of green infrastructure solutions for managing urban stormwater runoff in metropolitan areas.",
      keywords: ["green infrastructure", "stormwater", "urban planning", "sustainability"],
      status: "submitted",
      workflowStage: "new",
      reviewerCount: 0,
      reviewsCompleted: 0,
      daysAgo: 4,
    },
    // Accepted
    {
      title: "Microplastic Pollution in Freshwater Ecosystems",
      abstract:
        "Assessment of microplastic contamination in rivers and lakes with implications for aquatic life and human health.",
      keywords: ["microplastics", "pollution", "freshwater", "ecosystem"],
      status: "accepted",
      workflowStage: "decision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 20,
    },
  ],
  jbf: [
    // Published
    {
      title: "Impact of ESG Investing on Portfolio Performance",
      abstract:
        "Empirical analysis of environmental, social, and governance factors on investment returns across 500 companies.",
      keywords: ["ESG", "investing", "portfolio management", "sustainable finance"],
      status: "published",
      workflowStage: "published",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 40,
    },
    // Under review
    {
      title: "Digital Transformation in Banking: Challenges and Opportunities",
      abstract:
        "Examination of digital banking adoption and its effects on traditional financial services across emerging markets.",
      keywords: ["digital banking", "fintech", "transformation", "financial services"],
      status: "under_review",
      workflowStage: "in_review",
      reviewerCount: 2,
      reviewsCompleted: 0,
      daysAgo: 8,
    },
    // Declined
    {
      title: "Cryptocurrency Regulation: A Global Comparative Study",
      abstract: "Comparative analysis of cryptocurrency regulatory frameworks across major economies.",
      keywords: ["cryptocurrency", "regulation", "blockchain", "financial policy"],
      status: "declined",
      workflowStage: "decision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "decline",
      daysAgo: 30,
    },
    // New submission
    {
      title: "Central Bank Digital Currencies: Implementation Challenges",
      abstract: "Analysis of technical and regulatory challenges in implementing central bank digital currencies.",
      keywords: ["CBDC", "digital currency", "central bank", "monetary policy"],
      status: "submitted",
      workflowStage: "new",
      reviewerCount: 0,
      reviewsCompleted: 0,
      daysAgo: 1,
    },
  ],
  jedu: [
    // Published
    {
      title: "Gamification in Higher Education: Effects on Student Engagement",
      abstract:
        "Study of gamification strategies and their impact on student motivation and learning outcomes in university courses.",
      keywords: ["gamification", "education", "engagement", "learning"],
      status: "published",
      workflowStage: "published",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 50,
    },
    // Under review
    {
      title: "Inclusive Education Practices for Students with Learning Disabilities",
      abstract:
        "Best practices for supporting diverse learners in mainstream educational settings based on multi-site study.",
      keywords: ["inclusive education", "learning disabilities", "special education", "pedagogy"],
      status: "under_review",
      workflowStage: "in_review",
      reviewerCount: 2,
      reviewsCompleted: 1,
      daysAgo: 12,
    },
    // Accepted
    {
      title: "AI-Powered Adaptive Learning Systems: A Meta-Analysis",
      abstract:
        "Meta-analysis of artificial intelligence applications in personalized learning environments covering 45 studies.",
      keywords: ["AI", "adaptive learning", "personalization", "edtech"],
      status: "accepted",
      workflowStage: "decision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "accept",
      daysAgo: 22,
    },
    // Revision required
    {
      title: "Remote Learning Effectiveness: Longitudinal Study",
      abstract:
        "Three-year longitudinal study examining the effectiveness of remote learning compared to traditional classroom instruction.",
      keywords: ["remote learning", "online education", "effectiveness", "longitudinal study"],
      status: "revision_required",
      workflowStage: "revision",
      reviewerCount: 2,
      reviewsCompleted: 2,
      recommendation: "major_revisions",
      daysAgo: 6,
    },
    // New submission
    {
      title: "Teacher Professional Development in Digital Age",
      abstract: "Examining effective strategies for teacher professional development in technology integration.",
      keywords: ["teacher training", "professional development", "technology", "pedagogy"],
      status: "submitted",
      workflowStage: "new",
      reviewerCount: 0,
      reviewsCompleted: 0,
      daysAgo: 2,
    },
  ],
}

// Legacy export for backward compatibility
export const articlesByJournal: Record<
  string,
  Array<{ title: string; abstract: string; keywords: string[] }>
> = Object.fromEntries(
  Object.entries(workflowArticlesByJournal).map(([journalPath, articles]) => [
    journalPath,
    articles.map(({ title, abstract, keywords }) => ({ title, abstract, keywords })),
  ]),
)

export const articleContentTemplates: Record<
  string,
  {
    sections: Array<{ title: string; content: string }>
    references: Array<{
      authors: string
      title: string
      journal: string
      volume: string
      pages: string
      year: number
      doi?: string
    }>
    acknowledgments: string
    funding: string
  }
> = {
  biomarkers: {
    sections: [
      {
        title: "1. Introduction",
        content:
          "Alzheimer's disease (AD) affects over 55 million people worldwide, with numbers expected to triple by 2050. Early detection remains crucial for effective intervention, yet current diagnostic methods rely heavily on expensive neuroimaging and invasive cerebrospinal fluid analysis. This study aims to identify reliable blood-based biomarkers that can enable cost-effective, non-invasive early detection of AD in primary care settings.",
      },
      {
        title: "2. Materials and Methods",
        content:
          "We conducted a prospective cohort study involving 2,847 participants aged 60-85 years from 12 medical centers across Indonesia. Blood samples were collected and analyzed using high-sensitivity immunoassays and mass spectrometry. Machine learning algorithms were employed to identify optimal biomarker combinations. The study was approved by the National Ethics Committee (Protocol #2024-0892).",
      },
      {
        title: "3. Results",
        content:
          "Our analysis identified a panel of five blood-based biomarkers (p-tau217, GFAP, NfL, Aβ42/40 ratio, and a novel protein marker IDAX-3) that achieved 95% sensitivity and 89% specificity for early AD detection. The combined panel outperformed individual markers and showed strong correlation with PET imaging results (r=0.87, p<0.001). Notably, changes were detectable up to 8 years before clinical symptom onset.",
      },
      {
        title: "4. Discussion",
        content:
          "These findings represent a significant advancement in AD diagnostics. The identified biomarker panel offers a practical, scalable solution for population-level screening. The high accuracy achieved suggests potential for integration into routine health checkups for at-risk populations. Limitations include the predominantly Indonesian cohort, warranting validation in diverse populations.",
      },
      {
        title: "5. Conclusion",
        content:
          "We have developed and validated a blood-based biomarker panel for early Alzheimer's disease detection with clinical-grade accuracy. This approach could transform AD screening by enabling early intervention and better patient outcomes. Future work will focus on multi-ethnic validation and development of point-of-care testing platforms.",
      },
    ],
    references: [
      {
        authors: "Hansson O, Edelmayer RM, Boxer AL, et al.",
        title:
          "The Alzheimer's Association appropriate use recommendations for blood biomarkers in Alzheimer's disease",
        journal: "Alzheimer's & Dementia",
        volume: "18",
        pages: "2669-2686",
        year: 2022,
        doi: "10.1002/alz.12756",
      },
      {
        authors: "Jack CR, Bennett DA, Blennow K, et al.",
        title: "NIA-AA Research Framework: Toward a biological definition of Alzheimer's disease",
        journal: "Alzheimer's & Dementia",
        volume: "14",
        pages: "535-562",
        year: 2018,
        doi: "10.1016/j.jalz.2018.02.018",
      },
      {
        authors: "Schindler SE, Bollinger JG, Ovod V, et al.",
        title: "High-precision plasma β-amyloid 42/40 predicts current and future brain amyloidosis",
        journal: "Neurology",
        volume: "93",
        pages: "e1647-e1659",
        year: 2019,
        doi: "10.1212/WNL.0000000000008081",
      },
      {
        authors: "Palmqvist S, Janelidze S, Quiroz YT, et al.",
        title:
          "Discriminative accuracy of plasma phospho-tau217 for Alzheimer disease vs other neurodegenerative disorders",
        journal: "JAMA",
        volume: "324",
        pages: "772-781",
        year: 2020,
        doi: "10.1001/jama.2020.12134",
      },
      {
        authors: "Teunissen CE, Verberk IMW, Thijssen EH, et al.",
        title: "Blood-based biomarkers for Alzheimer's disease: towards clinical implementation",
        journal: "The Lancet Neurology",
        volume: "21",
        pages: "66-77",
        year: 2022,
        doi: "10.1016/S1474-4422(21)00361-6",
      },
      {
        authors: "Benedet AL, Milà-Alomà M, Vrillon A, et al.",
        title:
          "Differences between plasma and cerebrospinal fluid glial fibrillary acidic protein levels across the Alzheimer disease continuum",
        journal: "JAMA Neurology",
        volume: "78",
        pages: "1471-1483",
        year: 2021,
        doi: "10.1001/jamaneurol.2021.3671",
      },
      {
        authors: "Ashton NJ, Janelidze S, Al Khleifat A, et al.",
        title: "A multicentre validation study of the diagnostic value of plasma neurofilament light",
        journal: "Nature Communications",
        volume: "12",
        pages: "3400",
        year: 2021,
        doi: "10.1038/s41467-021-23620-z",
      },
      {
        authors: "Simrén J, Ashton NJ, Blennow K, Zetterberg H.",
        title: "An update on fluid biomarkers for neurodegenerative diseases: recent success and challenges ahead",
        journal: "Current Opinion in Neurobiology",
        volume: "61",
        pages: "29-39",
        year: 2020,
        doi: "10.1016/j.conb.2019.11.019",
      },
    ],
    acknowledgments:
      "We thank all participants and their families for their invaluable contribution to this research. We also acknowledge the clinical staff at all participating centers for their dedication to data collection.",
    funding:
      "This research was supported by the Indonesian Ministry of Research and Technology (Grant No. RISTEK-2024-0156), the National Institute on Aging (NIA R01AG066107), and the Alzheimer's Association Indonesia Chapter.",
  },
  "deep-learning": {
    sections: [
      {
        title: "1. Introduction",
        content:
          "Natural Language Processing (NLP) has witnessed remarkable progress with the advent of deep learning architectures. Transformer-based models have revolutionized how machines understand and generate human language. This paper presents novel architectural improvements to existing transformer models, specifically targeting efficiency and multilingual capability while maintaining state-of-the-art performance on standard benchmarks.",
      },
      {
        title: "2. Related Work",
        content:
          "The transformer architecture introduced by Vaswani et al. (2017) has become the foundation for modern NLP systems. Subsequent developments include BERT, GPT series, and T5, each advancing different aspects of language understanding. Our work builds upon these foundations while addressing their computational limitations through innovative attention mechanisms and parameter-efficient fine-tuning strategies.",
      },
      {
        title: "3. Proposed Architecture",
        content:
          "We introduce the Efficient Multi-Head Sparse Attention (EMSA) mechanism, which reduces computational complexity from O(n²) to O(n log n) while preserving model expressiveness. Our architecture incorporates dynamic routing between attention heads, allowing the model to adaptively focus computational resources on the most informative tokens. We also propose a novel pre-training objective combining masked language modeling with contrastive learning.",
      },
      {
        title: "4. Experiments",
        content:
          "We evaluate our model on GLUE, SuperGLUE, SQuAD 2.0, and multilingual benchmarks including XTREME and XNLI. Our EMSA-BERT achieves 89.4% on GLUE (vs 87.6% for BERT-large) with 40% fewer parameters. On multilingual tasks, we observe an average improvement of 3.2% across 100 languages. Training was conducted on 8 NVIDIA A100 GPUs for 14 days using a custom distributed training framework.",
      },
      {
        title: "5. Analysis and Ablation Studies",
        content:
          "Ablation studies reveal that the dynamic routing mechanism contributes most significantly to performance gains (+2.1%), followed by the sparse attention pattern (+1.4%) and the contrastive pre-training objective (+0.9%). Visualization of attention patterns shows more interpretable and linguistically meaningful representations compared to baseline models.",
      },
      {
        title: "6. Conclusion",
        content:
          "We have presented EMSA-BERT, an efficient transformer architecture that achieves state-of-the-art results while significantly reducing computational requirements. Our innovations in attention mechanisms and pre-training objectives provide a pathway toward more sustainable and accessible NLP systems. Code and pre-trained models are available at github.com/iamjos-research/emsa-bert.",
      },
    ],
    references: [
      {
        authors: "Vaswani A, Shazeer N, Parmar N, et al.",
        title: "Attention is all you need",
        journal: "Advances in Neural Information Processing Systems",
        volume: "30",
        pages: "5998-6008",
        year: 2017,
      },
      {
        authors: "Devlin J, Chang MW, Lee K, Toutanova K.",
        title: "BERT: Pre-training of deep bidirectional transformers for language understanding",
        journal: "NAACL-HLT",
        volume: "1",
        pages: "4171-4186",
        year: 2019,
      },
      {
        authors: "Brown T, Mann B, Ryder N, et al.",
        title: "Language models are few-shot learners",
        journal: "Advances in Neural Information Processing Systems",
        volume: "33",
        pages: "1877-1901",
        year: 2020,
      },
      {
        authors: "Raffel C, Shazeer N, Roberts A, et al.",
        title: "Exploring the limits of transfer learning with a unified text-to-text transformer",
        journal: "Journal of Machine Learning Research",
        volume: "21",
        pages: "1-67",
        year: 2020,
      },
      {
        authors: "Liu Y, Ott M, Goyal N, et al.",
        title: "RoBERTa: A robustly optimized BERT pretraining approach",
        journal: "arXiv preprint arXiv:1907.11692",
        volume: "",
        pages: "",
        year: 2019,
      },
      {
        authors: "Clark K, Luong MT, Le QV, Manning CD.",
        title: "ELECTRA: Pre-training text encoders as discriminators rather than generators",
        journal: "ICLR",
        volume: "",
        pages: "",
        year: 2020,
      },
    ],
    acknowledgments:
      "We thank the anonymous reviewers for their constructive feedback. Special thanks to the IAMJOS AI Research Lab for providing computational resources.",
    funding:
      "This work was supported by the Indonesian AI Development Initiative (IAID-2024) and a Google Research Scholar Award.",
  },
  telemedicine: {
    sections: [
      {
        title: "1. Introduction",
        content:
          "The COVID-19 pandemic forced an unprecedented acceleration of telemedicine adoption worldwide. Healthcare systems that had previously resisted digital transformation implemented telehealth solutions within weeks. This study examines the factors influencing telemedicine adoption during global health crises and evaluates patient outcomes across 50 countries to identify best practices for sustainable telehealth implementation.",
      },
      {
        title: "2. Background",
        content:
          "Prior to 2020, telemedicine adoption varied significantly across regions, with regulatory barriers, reimbursement challenges, and technological infrastructure limiting widespread implementation. The pandemic removed many of these barriers overnight, creating a natural experiment in healthcare delivery transformation. Understanding the lessons from this period is crucial for building resilient health systems.",
      },
      {
        title: "3. Methodology",
        content:
          "We conducted a mixed-methods study combining quantitative analysis of healthcare utilization data from 50 countries (N=12.4 million patient encounters) with qualitative interviews of 847 healthcare providers and 2,156 patients. Data was collected between March 2020 and December 2023, covering the acute pandemic phase through the transition to endemic management.",
      },
      {
        title: "4. Results",
        content:
          "Telemedicine utilization increased by 3,800% during the first pandemic wave. Countries with existing digital infrastructure showed faster adoption (median 12 days vs 45 days). Patient satisfaction with telehealth averaged 4.2/5.0, with convenience and reduced exposure risk cited as primary benefits. Clinical outcomes for chronic disease management showed non-inferiority compared to in-person care (HbA1c difference: 0.1%, p=0.34). However, diagnostic accuracy for acute conditions was lower in telehealth (82% vs 94% for in-person).",
      },
      {
        title: "5. Discussion",
        content:
          "Our findings suggest telemedicine is most effective as a complement to, rather than replacement for, traditional care. Optimal implementation requires hybrid models that leverage telehealth for routine follow-ups while maintaining in-person access for acute and complex cases. Policy recommendations include permanent regulatory flexibility, sustainable reimbursement models, and investment in digital health literacy.",
      },
      {
        title: "6. Conclusion",
        content:
          "The pandemic-driven telemedicine expansion demonstrated both the potential and limitations of virtual care. Sustainable integration requires addressing the digital divide, developing appropriate clinical protocols, and maintaining the human element of healthcare. The lessons learned provide a roadmap for healthcare systems preparing for future health emergencies.",
      },
    ],
    references: [
      {
        authors: "Wosik J, Fudim M, Cameron B, et al.",
        title: "Telehealth transformation: COVID-19 and the rise of virtual care",
        journal: "Journal of the American Medical Informatics Association",
        volume: "27",
        pages: "957-962",
        year: 2020,
        doi: "10.1093/jamia/ocaa067",
      },
      {
        authors: "Monaghesh E, Hajizadeh A.",
        title: "The role of telehealth during COVID-19 outbreak: a systematic review based on current evidence",
        journal: "BMC Public Health",
        volume: "20",
        pages: "1193",
        year: 2020,
        doi: "10.1186/s12889-020-09301-4",
      },
      {
        authors: "Hollander JE, Carr BG.",
        title: "Virtually perfect? Telemedicine for COVID-19",
        journal: "New England Journal of Medicine",
        volume: "382",
        pages: "1679-1681",
        year: 2020,
        doi: "10.1056/NEJMp2003539",
      },
      {
        authors: "Keesara S, Jonas A, Schulman K.",
        title: "COVID-19 and health care's digital revolution",
        journal: "New England Journal of Medicine",
        volume: "382",
        pages: "e82",
        year: 2020,
        doi: "10.1056/NEJMp2005835",
      },
      {
        authors: "Dorsey ER, Topol EJ.",
        title: "Telemedicine 2020 and the next decade",
        journal: "The Lancet",
        volume: "395",
        pages: "859",
        year: 2020,
        doi: "10.1016/S0140-6736(20)30424-4",
      },
    ],
    acknowledgments:
      "We acknowledge the healthcare workers worldwide who contributed data during extremely challenging circumstances. Their dedication to both patient care and research is deeply appreciated.",
    funding:
      "This study was funded by the World Health Organization Emergency Response Fund and the Gates Foundation Global Health Initiative (Grant #OPP1234567).",
  },
}

export function getArticleContent(keywords: string[]): (typeof articleContentTemplates)[string] | null {
  if (keywords.some((k) => k.toLowerCase().includes("biomarker") || k.toLowerCase().includes("alzheimer"))) {
    return articleContentTemplates["biomarkers"]
  }
  if (
    keywords.some(
      (k) =>
        k.toLowerCase().includes("deep learning") ||
        k.toLowerCase().includes("nlp") ||
        k.toLowerCase().includes("transformer"),
    )
  ) {
    return articleContentTemplates["deep-learning"]
  }
  if (
    keywords.some(
      (k) =>
        k.toLowerCase().includes("telemedicine") ||
        k.toLowerCase().includes("telehealth") ||
        k.toLowerCase().includes("pandemic"),
    )
  ) {
    return articleContentTemplates["telemedicine"]
  }
  // Return generic content for other articles
  return {
    sections: [
      {
        title: "1. Introduction",
        content:
          "This research addresses a significant challenge in the field, presenting novel methodologies and findings that contribute to the existing body of knowledge. The motivation for this study stems from recent developments and the need for innovative solutions.",
      },
      {
        title: "2. Literature Review",
        content:
          "Previous studies have explored various aspects of this topic, establishing a foundation for our research. Key contributions from prior work include theoretical frameworks and empirical findings that inform our approach.",
      },
      {
        title: "3. Methodology",
        content:
          "We employed a rigorous research methodology combining quantitative and qualitative approaches. Data collection involved multiple sources and validation techniques to ensure reliability and validity of our findings.",
      },
      {
        title: "4. Results",
        content:
          "Our analysis reveals significant findings that advance understanding in this area. Statistical analyses demonstrate robust support for our hypotheses, with effect sizes indicating practical significance.",
      },
      {
        title: "5. Discussion",
        content:
          "The findings have important implications for both theory and practice. We discuss limitations of the current study and propose directions for future research to address remaining questions.",
      },
      {
        title: "6. Conclusion",
        content:
          "This study makes meaningful contributions to the field through its novel approach and significant findings. The results have practical applications and open new avenues for further investigation.",
      },
    ],
    references: [
      {
        authors: "Smith J, Johnson M, Williams K.",
        title: "Foundational perspectives on the research topic",
        journal: "International Journal of Research",
        volume: "15",
        pages: "234-256",
        year: 2022,
      },
      {
        authors: "Chen L, Garcia R, Patel S.",
        title: "Methodological advances in the field",
        journal: "Research Methods Quarterly",
        volume: "28",
        pages: "89-112",
        year: 2021,
      },
      {
        authors: "Anderson P, Thompson E, Davis M.",
        title: "Theoretical frameworks for analysis",
        journal: "Theory and Practice",
        volume: "42",
        pages: "445-467",
        year: 2023,
      },
      {
        authors: "Brown A, Wilson T, Lee H.",
        title: "Empirical findings and their implications",
        journal: "Journal of Applied Studies",
        volume: "19",
        pages: "178-195",
        year: 2022,
      },
    ],
    acknowledgments:
      "We thank our colleagues and collaborators for their valuable insights and support throughout this research project.",
    funding: "This research was supported by institutional funding and research grants.",
  }
}
