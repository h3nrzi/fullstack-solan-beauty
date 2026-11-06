'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ConsultationRequestDto,
  ConsultationStatus,
} from '@salon/shared';
import {
  HelpCircle,
  PlusCircle,
  AlertCircle,
  Clock,
  PauseCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  createCustomerConsultationAction,
  provideCustomerConsultationInfoAction,
  withdrawCustomerConsultationAction,
} from '../../actions/consultation';

function getConsultationStatusBadge(status: ConsultationStatus) {
  switch (status) {
    case ConsultationStatus.PENDING_REVIEW:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          در انتظار بررسی پذیرش
        </span>
      );
    case ConsultationStatus.ASSIGNED_CONSULTANT:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
          ارجاع به مشاور متخصص
        </span>
      );
    case ConsultationStatus.NEEDS_INFO:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
          نیازمند اطلاعات تکمیلی شما
        </span>
      );
    case ConsultationStatus.PROPOSAL_READY:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
          پیشنهاد مشاوره آماده شد
        </span>
      );
    case ConsultationStatus.RESULT_COMMUNICATED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          نتیجه اعلام‌شده
        </span>
      );
    case ConsultationStatus.WITHDRAWN:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
          پس‌گرفته‌شده
        </span>
      );
    case ConsultationStatus.CLOSED_WITHOUT_BOOKING:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
          بسته‌شده
        </span>
      );
    default:
      return null;
  }
}

interface CustomerConsultationsSectionProps {
  consultations?: ConsultationRequestDto[];
}

export function CustomerConsultationsSection({
  consultations = [],
}: CustomerConsultationsSectionProps) {
  const router = useRouter();

  // New consultation form state
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredSchedule, setPreferredSchedule] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Provide info form state
  const [answeringRequestId, setAnsweringRequestId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  // Withdraw state
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setCreateError('لطفاً توضیحات وضعیت مو یا پوست خود را بنویسید.');
      return;
    }
    setCreating(true);
    setCreateError(null);

    const res = await createCustomerConsultationAction({
      customServiceTitle: customTitle.trim() || undefined,
      customerNotes: notes.trim(),
      preferredSchedule: preferredSchedule.trim() || undefined,
    });

    setCreating(false);
    if (!res.success) {
      setCreateError(res.error || 'خطا در ثبت درخواست');
    } else {
      setShowNewConsultation(false);
      setCustomTitle('');
      setNotes('');
      setPreferredSchedule('');
      router.refresh();
    }
  };

  const handleProvideInfo = async (requestId: string) => {
    if (!answerText.trim()) return;
    setSubmittingAnswer(true);
    setAnswerError(null);

    const res = await provideCustomerConsultationInfoAction(requestId, answerText.trim());
    setSubmittingAnswer(false);
    if (!res.success) {
      setAnswerError(res.error || 'خطا در ارسال پاسخ');
    } else {
      setAnsweringRequestId(null);
      setAnswerText('');
      router.refresh();
    }
  };

  const handleWithdraw = async (requestId: string) => {
    if (!confirm('آیا از پس‌گرفتن و لغو این درخواست بررسی اطمینان دارید؟')) return;
    setWithdrawingId(requestId);
    await withdrawCustomerConsultationAction(requestId, 'انصراف توسط مشتری از حساب کاربری');
    setWithdrawingId(null);
    router.refresh();
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-700" aria-hidden="true" />
            درخواست‌های بررسی و مشاوره تخصصی
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            خدماتی که نیاز به بررسی شرایط مو، پوست یا مدت زمان دارند (با بودجه پیگیری ۴ ساعت کاری سالن)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowNewConsultation(!showNewConsultation)}
          className="text-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 ml-1.5" aria-hidden="true" />
          {showNewConsultation ? 'بستن فرم' : 'درخواست بررسی جدید'}
        </Button>
      </div>

      {/* New Consultation Form */}
      {showNewConsultation && (
        <form
          onSubmit={handleCreateConsultation}
          className="p-5 border border-purple-200 bg-purple-50/40 rounded-xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center gap-2 text-xs text-purple-900 bg-purple-100/60 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 text-purple-700 shrink-0" aria-hidden="true" />
            <span>
              توجه: ثبت درخواست بررسی <strong>هیچ بیعانه یا ظرفیت قطعی نوبت ایجاد نمی‌کند</strong>. پذیرش و مشاور سالن ظرف حداکثر ۴ ساعت کاری شرایط و پیشنهاد معتبر را به شما اعلام خواهند کرد.
            </span>
          </div>

          <div>
            <Input
              id="customServiceTitle"
              label="عنوان خدمت یا درمان مورد نظر (اختیاری)"
              placeholder="مثال: دکلره و بالیاژ موی حساس، پاکسازی و فیشیال تخصصی"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              توضیحات تکمیلی، شرایط فعلی و سوالات شما: <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="مثلاً: ۶ ماه پیش رنگ تیره گذاشتم، مایل به روشن کردن هستم بدون آسیب..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm p-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-right"
            />
          </div>

          <div>
            <Input
              id="preferredSchedule"
              label="زمان‌ها یا روزهای پیشنهادی برای مراجعه (اختیاری)"
              placeholder="مثال: شنبه تا دوشنبه عصرها"
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              className="text-sm"
            />
          </div>

          {createError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{createError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewConsultation(false)}
              className="text-xs cursor-pointer"
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" loading={creating} className="text-xs cursor-pointer">
              ثبت درخواست بررسی
            </Button>
          </div>
        </form>
      )}

      {consultations.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-xl">
          <HelpCircle className="w-10 h-10 text-stone-300 mx-auto mb-2" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-stone-800">
            هنوز هیچ درخواست بررسی ثبت نکرده‌اید
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-3">
            اگر درباره نوع خدمت، سلامت مو یا هزینه اطمینان ندارید، می‌توانید درخواست مشاوره رایگان ثبت کنید.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowNewConsultation(true)}
            className="text-xs cursor-pointer"
          >
            ثبت درخواست بررسی
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {consultations.map((c) => {
            const isTerminal = ([
              ConsultationStatus.RESULT_COMMUNICATED,
              ConsultationStatus.CLOSED_WITHOUT_BOOKING,
              ConsultationStatus.WITHDRAWN,
            ] as ConsultationStatus[]).includes(c.status);

            return (
              <div
                key={c.id}
                className="p-5 border border-stone-200 rounded-xl bg-stone-50/40 hover:border-purple-200 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm sm:text-base">
                      {c.customServiceTitle || c.serviceName || 'درخواست مشاوره نامعلوم'}
                    </span>
                    {getConsultationStatusBadge(c.status)}
                  </div>

                  {/* SLA Budget Status */}
                  <div className="flex items-center gap-2 text-xs">
                    {c.isPaused ? (
                      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        شمارش بودجه متوقف (در انتظار پاسخ شما)
                      </span>
                    ) : !isTerminal ? (
                      <span className="flex items-center gap-1 text-stone-600 bg-stone-100 px-2 py-1 rounded-md font-mono">
                        <Clock className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                        {c.remainingMinutes} دقیقه باقی‌مانده از ۴ ساعت کاری
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {c.customerNotes}
                </p>

                {c.assignedStaffName && (
                  <p className="text-xs text-stone-600">
                    مشاور مسئول: <span className="font-medium text-stone-800">{c.assignedStaffName}</span>
                  </p>
                )}

                {/* Supplementary Info Request Box */}
                {c.status === ConsultationStatus.NEEDS_INFO && (
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
                      <MessageSquare className="w-4 h-4 text-rose-700" aria-hidden="true" />
                      سوال یا نیاز تکمیلی مشاور سالن:
                    </div>
                    <p className="text-xs text-rose-800 bg-white/80 p-2.5 rounded-lg border border-rose-100">
                      {c.events?.filter((e) => e.eventType === 'INFO_REQUESTED').slice(-1)[0]?.note ||
                        'لطفاً اطلاعات تکمیلی اعلام‌شده را ارسال کنید.'}
                    </p>

                    {answeringRequestId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          placeholder="پاسخ خود را اینجا بنویسید..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 text-right bg-white"
                        />
                        {answerError && <p className="text-xs text-red-600">{answerError}</p>}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setAnsweringRequestId(null)}
                            className="text-xs py-1.5 cursor-pointer"
                          >
                            انصراف
                          </Button>
                          <Button
                            variant="primary"
                            loading={submittingAnswer}
                            onClick={() => handleProvideInfo(c.id)}
                            className="text-xs py-1.5 bg-rose-700 hover:bg-rose-800 cursor-pointer"
                          >
                            ارسال پاسخ تکمیلی
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAnsweringRequestId(c.id);
                          setAnswerText('');
                        }}
                        className="text-xs py-1.5 border-rose-300 text-rose-900 hover:bg-rose-100 cursor-pointer"
                      >
                        ارسال پاسخ و ادامه پیگیری
                      </Button>
                    )}
                  </div>
                )}

                {/* Communicated Result Box */}
                {c.status === ConsultationStatus.RESULT_COMMUNICATED && c.resultNotes && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      نتیجه نهایی اعلام‌شده توسط مشاور:
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed pt-1">
                      {c.resultNotes}
                    </p>
                  </div>
                )}

                {/* Actions (e.g. withdraw) */}
                {!isTerminal && (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="outline"
                      onClick={() => handleWithdraw(c.id)}
                      loading={withdrawingId === c.id}
                      className="text-xs text-stone-600 hover:text-red-700 hover:border-red-300 py-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                      انصراف و پس‌گرفتن درخواست
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
