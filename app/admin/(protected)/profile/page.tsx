"use client"

import { Building2, Globe, Mail, MapPin, Phone, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const EMPTY_VALUE = "--"

type CompanyProfile = {
  companyName: string
  phone: string
  email: string
  website: string
  address: string
}

type AdminProfileResponse = {
  success: boolean
  admin?: { email: string }
  company?: CompanyProfile | null
  error?: string
}

function StaticCompanyLogo() {
  return (
    <div className="mx-auto flex h-56 w-64 items-center justify-center text-primary lg:mx-0 lg:justify-self-end">
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox="0 0 256 224"
        fill="none"
      >
        <path
          d="M30 194h196"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.18"
        />
        <path
          d="M62 194V69l72-30v155"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M134 194V92l62 24v78"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M82 88h16M82 112h16M82 136h16M82 160h16"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M158 128h15M158 153h15"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M45 194v-48h-17v48M210 194v-38h18v38"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M62 69l72-30v28"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.38"
        />
      </svg>
    </div>
  )
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [adminEmail, setAdminEmail] = useState("")
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/admin/profile")

        if (response.status === 401) {
          router.replace("/admin/login")
          return
        }

        const data = (await response.json()) as AdminProfileResponse

        if (!isActive) {
          return
        }

        if (response.ok && data.success) {
          setAdminEmail(data.admin?.email || "")
          setCompany(data.company ?? null)
          return
        }

        setError(data.error || "Failed to load profile")
      } catch (profileError) {
        if (!isActive) {
          return
        }
        console.error(profileError)
        setError("An unexpected error occurred")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [router])

  return (
    <>
      <section className="space-y-2">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground md:text-[38px]">
          Profile
        </h1>
        <p className="max-w-2xl text-[15px] text-muted-foreground md:text-base">
          Your admin account and company details.
        </p>
      </section>

      {isLoading ? (
        <section className="space-y-5">
          <div className="h-[140px] animate-pulse rounded-[24px] bg-muted" />
          <div className="h-[260px] animate-pulse rounded-[24px] bg-muted" />
        </section>
      ) : error ? (
        <section className="rounded-[24px] border border-border/70 bg-card px-5 py-12 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:px-8">
          <p className="font-medium text-[#ff7a7a]">{error}</p>
        </section>
      ) : (
        <section className="space-y-5">
          <article className="overflow-hidden rounded-[24px] border border-border/70 bg-card p-6 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-[22px] font-bold uppercase tracking-[0.08em] text-foreground">
                Admin Account
              </h2>
            </div>
            <div className="grid gap-7 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Email
                </p>
                <p className="text-[18px] font-bold leading-relaxed text-foreground">
                  {adminEmail || EMPTY_VALUE}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Role
                </p>
                <p className="text-[18px] font-bold leading-relaxed text-foreground">Administrator</p>
              </div>
            </div>
          </article>

          <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
            <div className="border-b border-border/70 px-6 py-5 md:px-8">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                  Company Details
                </h2>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Company Name
                  </p>
                  <p className="text-[18px] font-bold leading-relaxed text-foreground">
                    {company?.companyName || EMPTY_VALUE}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Website
                  </p>
                  <div className="flex items-center gap-2 text-[18px] font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-primary" />
                    <span>{company?.website || EMPTY_VALUE}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Phone
                  </p>
                  <div className="flex items-center gap-2 text-[18px] font-semibold text-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{company?.phone || EMPTY_VALUE}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Email
                  </p>
                  <div className="flex items-center gap-2 text-[18px] font-semibold text-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{company?.email || EMPTY_VALUE}</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Address
                  </p>
                  <div className="flex items-start gap-2 text-[18px] font-semibold leading-8 text-foreground">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span className="whitespace-pre-line">{company?.address || EMPTY_VALUE}</span>
                  </div>
                </div>
              </div>

              <StaticCompanyLogo />
            </div>
          </section>
        </section>
      )}
    </>
  )
}
