'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Globe } from 'lucide-react'

interface Journal {
    id: string | number
    name: string
    acronym?: string
    description?: string
    path?: string
    issn?: string
}

interface JournalListProps {
    journals: Journal[]
}

function JournalCard({ journal }: { journal: Journal }) {
    const displayAcronym = journal.acronym || journal.name?.slice(0, 2) || 'JN'

    return (
        <Link
            href={`/browse/journal/${journal.path || journal.id}`}
            className="group block rounded-xl border bg-card p-4 sm:p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-base sm:text-lg shrink-0">
                    {displayAcronym.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-2">
                        {journal.name || 'Untitled Journal'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {journal.description || 'No description available'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
                        <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[10px] sm:text-xs text-foreground">
                            {displayAcronym}
                        </span>
                        {journal.issn && (
                            <span className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                ISSN: {journal.issn}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

export function JournalList({ journals }: JournalListProps) {
    if (!journals || journals.length === 0) {
        return (
            <div className="text-center py-12 sm:py-16">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No journals found</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Check back later for new journals
                </p>
            </div>
        )
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {journals.map((journal, index) => (
                <JournalCard key={journal.id || `journal-${index}`} journal={journal} />
            ))}
        </div>
    )
}
