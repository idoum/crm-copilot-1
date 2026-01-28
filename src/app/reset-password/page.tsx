import ResetPasswordClient from './page-client'

interface PageProps {
  searchParams?: Promise<{ token?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  // Await searchParams (Next.js 15+ async behavior)
  const params = await searchParams
  const rawToken = params?.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  return <ResetPasswordClient token={token} />
}
