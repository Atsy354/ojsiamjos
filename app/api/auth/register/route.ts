import { NextRequest, NextResponse } from "next/server"
import { createClient, supabaseAdmin } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      affiliation,
      orcid,
      whatsappNumber,
      phone,
      username,
      salutation,
      country,
      workingLanguages,
      reviewingInterests,
      receiveNotifications,
      agreePrivacy,
      roles,
      role,
      journalId,
    } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    const normalizedPhone = typeof phone === "string" ? phone.trim() : ""
    const normalizedWhatsapp = typeof whatsappNumber === "string" ? whatsappNumber.trim() : ""

    if (!normalizedPhone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 })
    }

    if (!normalizedWhatsapp) {
      return NextResponse.json({ error: "WhatsApp is required" }, { status: 400 })
    }

    if (agreePrivacy !== true) {
      return NextResponse.json({ error: "You must agree to the privacy statement" }, { status: 400 })
    }

    const supabase = await createClient()
    const admin = supabaseAdmin

    // Check if user already exists
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    if (typeof username === "string" && username.trim()) {
      const { data: existingUsername, error: usernameCheckError } = await admin
        .from("users")
        .select("id")
        .eq("username", username.trim())
        .single()

      // If the column doesn't exist yet, ignore. Otherwise enforce uniqueness.
      if (!usernameCheckError && existingUsername) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 })
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Hash password for database storage
    const hashedPassword = await bcrypt.hash(password, 10)

    const rawRoles = Array.isArray(roles) ? roles : [role]
    const requestedRoles = Array.from(new Set(rawRoles)).filter((r) => r === "author" || r === "reviewer")
    if (requestedRoles.length === 0) requestedRoles.push("author")

    if (requestedRoles.includes("reviewer")) {
      const ri = typeof reviewingInterests === "string" ? reviewingInterests.trim() : ""
      if (!ri) {
        return NextResponse.json({ error: "Reviewing interests is required for Reviewer" }, { status: 400 })
      }
    }

    const baseInsert: Record<string, any> = {
      id: authData.user?.id,
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      roles: requestedRoles,
    }

    if (typeof affiliation === "string" && affiliation.trim()) {
      baseInsert.affiliation = affiliation.trim()
    }

    if (typeof middleName === "string" && middleName.trim()) {
      baseInsert.middle_name = middleName.trim()
    }

    if (typeof salutation === "string" && salutation.trim()) {
      baseInsert.salutation = salutation.trim()
    }

    if (typeof country === "string" && country.trim()) {
      baseInsert.country = country.trim()
    }

    if (typeof username === "string" && username.trim()) {
      baseInsert.username = username.trim()
    }

    if (Array.isArray(workingLanguages) && workingLanguages.length > 0) {
      baseInsert.working_languages = workingLanguages
    }

    if (typeof reviewingInterests === "string" && reviewingInterests.trim()) {
      baseInsert.reviewing_interests = reviewingInterests.trim()
    }

    if (receiveNotifications === true) {
      baseInsert.receive_notifications = true
    }

    baseInsert.privacy_accepted_at = new Date().toISOString()

    if (typeof orcid === "string" && orcid.trim()) {
      baseInsert.orcid = orcid.trim()
    }

    baseInsert.phone = normalizedPhone
    baseInsert.whatsapp_number = normalizedWhatsapp

    if (journalId) {
      baseInsert.journal_id = journalId
    }

    // Create user in database (schema-tolerant fallbacks)
    let user: any = null
    let dbError: any = null

    const attemptInsert = async (payload: Record<string, any>) => {
      return await admin.from("users").upsert(payload, { onConflict: "id" }).select().single()
    }

    let payload = { ...baseInsert }
    for (let i = 0; i < 12; i++) {
      ;({ data: user, error: dbError } = await attemptInsert(payload))
      if (!dbError) break

      // If the row already exists (e.g. partial previous attempt), fetch it and continue.
      if ((dbError as any)?.code === "23505" && authData.user?.id) {
        const { data: existingById, error: existingByIdError } = await admin
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (!existingByIdError && existingById) {
          user = existingById
          dbError = null
          break
        }
      }

      const msg = typeof dbError?.message === "string" ? dbError.message : ""
      const missingCol =
        msg.match(/column\s+\"([^\"]+)\"/i)?.[1] ??
        msg.match(/Could not find the '([^']+)' column/i)?.[1] ??
        msg.match(/Could not find the \"([^\"]+)\" column/i)?.[1]

      if (!missingCol) break
      if (missingCol in payload) {
        delete payload[missingCol]
        continue
      }
      break
    }

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (journalId && authData.user?.id) {
      const membershipRows = requestedRoles.map((r) => ({ user_id: authData.user!.id, journal_id: journalId, role: r }))

      const { error: membershipError } = await admin.from("user_journal_roles").insert(membershipRows)

      // Do not fail registration if membership table isn't present yet or conflicts.
      if (membershipError) {
        console.warn("Register membership insert failed:", membershipError)
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles,
        journalId: user.journal_id ?? null,
      },
      session: authData.session,
    }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
