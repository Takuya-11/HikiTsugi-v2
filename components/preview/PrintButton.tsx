'use client'

import { Button } from '@/components/ui/button'

export default function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      印刷 / PDF 保存
    </Button>
  )
}
