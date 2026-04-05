'use client'

import { useCallback, useId, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { cropToWebPBlob } from '@/app/lib/canvas-crop'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const ASPECT = 16 / 9

type Props = {
  /** 부모가 폼 제출 시 `thumbnail` 필드로 넣을 파일 */
  onPreparedFileChange: (file: File | null) => void
  /** 수정 폼: 기존 썸네일 URL (표시만) */
  existingImageUrl?: string | null
}

export function ThumbnailCropField({ onPreparedFileChange, existingImageUrl }: Props) {
  const inputId = useId()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [preparedPreviewUrl, setPreparedPreviewUrl] = useState<string | null>(null)
  const [preparedFile, setPreparedFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revoke = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }, [])

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('이미지 파일만 선택할 수 있습니다.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    setError(null)
    revoke(imageSrc)
    revoke(preparedPreviewUrl)
    setPreparedFile(null)
    setPreparedPreviewUrl(null)
    onPreparedFileChange(null)
    const url = URL.createObjectURL(f)
    setImageSrc(url)
    setCropOpen(true)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
  }

  const applyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError('먼저 이미지를 선택하고 영역을 맞춰 주세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const blob = await cropToWebPBlob(imageSrc, croppedAreaPixels)
      const file = new File([blob], 'thumbnail.webp', { type: 'image/webp' })
      revoke(preparedPreviewUrl)
      const preview = URL.createObjectURL(blob)
      setPreparedPreviewUrl(preview)
      setPreparedFile(file)
      onPreparedFileChange(file)
      setCropOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '자르기에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const clearAll = () => {
    revoke(imageSrc)
    revoke(preparedPreviewUrl)
    setImageSrc(null)
    setPreparedPreviewUrl(null)
    setPreparedFile(null)
    onPreparedFileChange(null)
    setCropOpen(false)
    setError(null)
  }

  const reopenCrop = () => {
    if (imageSrc) setCropOpen(true)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>썸네일 이미지 (16:9)</Label>
      <p className="text-xs text-muted-foreground">
        이미지를 고른 뒤 16:9 비율로 맞춰 자릅니다. 쇼케이스 카드와 동일한 비율로 보입니다.
      </p>

      {existingImageUrl && !preparedPreviewUrl && !imageSrc ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingImageUrl}
              alt="현재 썸네일"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="text-xs text-muted-foreground">현재 썸네일입니다. 바꾸려면 아래에서 새 이미지를 선택하세요.</p>
        </div>
      ) : null}

      {preparedPreviewUrl && !cropOpen ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preparedPreviewUrl}
              alt="선택한 썸네일 미리보기"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={reopenCrop}>
              다시 자르기
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearAll}>
              썸네일 제거
            </Button>
          </div>
        </div>
      ) : null}

      {cropOpen && imageSrc ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">확대</Label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyCrop} disabled={busy || !croppedAreaPixels}>
              {busy ? '처리 중…' : '이 영역으로 자르기'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearAll}>
              취소
            </Button>
          </div>
        </div>
      ) : null}

      {!cropOpen && (
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onPickFile}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
        />
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
