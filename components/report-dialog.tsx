'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Swal from 'sweetalert2'
import { useLanguage } from '@/components/language-provider'

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: 'post' | 'comment'
  entityId: string
  onReportSubmitted?: () => void
}

const REPORT_REASONS = {
  en: [
    { value: 'spam', label: 'Spam or misleading content' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech or offensive content' },
    { value: 'inappropriate', label: 'Inappropriate or explicit content' },
    { value: 'copyright', label: 'Copyright violation' },
    { value: 'other', label: 'Other' }
  ],
  ar: [
    { value: 'spam', label: 'محتوى مزعج أو مضلل' },
    { value: 'harassment', label: 'مضايقة أو تنمر' },
    { value: 'hate_speech', label: 'خطاب كراهية أو محتوى مسيء' },
    { value: 'inappropriate', label: 'محتوى غير لائق أو صريح' },
    { value: 'copyright', label: 'انتهاك حقوق النشر' },
    { value: 'other', label: 'أخرى' }
  ],
  nl: [
    { value: 'spam', label: 'Spam of misleidende inhoud' },
    { value: 'harassment', label: 'Intimidatie of pesten' },
    { value: 'hate_speech', label: 'Haatzaaiende taal of aanstootgevende inhoud' },
    { value: 'inappropriate', label: 'Ongepaste of expliciete inhoud' },
    { value: 'copyright', label: 'Auteursrechtschending' },
    { value: 'other', label: 'Anders' }
  ]
}

export function ReportDialog({ open, onOpenChange, entityType, entityId, onReportSubmitted }: ReportDialogProps) {
  const { t, language } = useLanguage()
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reasons = REPORT_REASONS[language as keyof typeof REPORT_REASONS] || REPORT_REASONS.en

  const handleSubmit = async () => {
    if (!reason) {
      await Swal.fire({
        title: t('error'),
        text: t('pleaseSelectReason'),
        icon: 'warning',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t('ok'),
        buttonsStyling: true,
        customClass: {
          confirmButton: 'swal2-confirm-custom'
        }
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          reason,
          description: description.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        await Swal.fire({
          title: t('reportSubmitted'),
          text: t('reportSubmittedMessage'),
          icon: 'success',
          confirmButtonColor: '#059669',
          confirmButtonText: t('ok'),
          buttonsStyling: true,
          customClass: {
            confirmButton: 'swal2-confirm-success'
          }
        })
        onOpenChange(false)
        setReason('')
        setDescription('')
        onReportSubmitted?.()
      } else {
        await Swal.fire({
          title: t('error'),
          text: data.message || t('failedToSubmitReport'),
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t('ok'),
          buttonsStyling: true,
          customClass: {
            confirmButton: 'swal2-confirm-custom'
          }
        })
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      await Swal.fire({
        title: t('error'),
        text: t('somethingWentWrong'),
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t('ok'),
        buttonsStyling: true,
        customClass: {
          confirmButton: 'swal2-confirm-custom'
        }
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false)
      setReason('')
      setDescription('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reportContent')}</DialogTitle>
          <DialogDescription>
            {entityType === 'post' ? t('reportPostDescription') : t('reportCommentDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('selectReason')}</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasons.map((reasonOption) => (
                <div key={reasonOption.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reasonOption.value} id={reasonOption.value} />
                  <Label
                    htmlFor={reasonOption.value}
                    className="font-normal cursor-pointer"
                  >
                    {reasonOption.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="description">{t('additionalDetails')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('describeIssue')}
                rows={3}
              />
            </div>
          )}

          {reason && reason !== 'other' && (
            <div className="space-y-2">
              <Label htmlFor="description-optional">{t('additionalDetails')} ({t('optional')})</Label>
              <Textarea
                id="description-optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('additionalInfo')}
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !reason}
            >
              {submitting ? t('submitting') : t('submitReport')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

