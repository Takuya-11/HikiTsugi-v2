import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from 'cn'

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">HikiTsugi</h1>
          <p className="mt-3 text-muted-foreground">
            IT運用業務の引き継ぎ書を、簡単に・正確に・安全に。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            ログイン
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}>
            アカウント作成
          </Link>
        </div>
      </div>
    </div>
  )
}
