'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Clock,
  User,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import { PendingRecoveryRequestItem } from '../../lib/api';
import {
  approveRecoveryAction,
  rejectRecoveryAction,
} from '../../actions/emergency-recovery';

interface RecoveryRequestsListProps {
  initialRequests: PendingRecoveryRequestItem[];
  currentStaffId: string;
}

export function RecoveryRequestsList({
  initialRequests,
  currentStaffId,
}: RecoveryRequestsListProps) {
  const [requests, setRequests] = useState<PendingRecoveryRequestItem[]>(initialRequests);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Approve Flow State
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedClaimModal, setApprovedClaimModal] = useState<{
    targetStaffName: string;
    claimToken: string;
    requestId: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Reject Flow State
  const [rejectingItem, setRejectingItem] = useState<PendingRecoveryRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const handleApprove = async (req: PendingRecoveryRequestItem) => {
    setApprovingId(req.id);
    setAlertMessage(null);

    try {
      const res = await approveRecoveryAction({ requestId: req.id });
      if (!res.success || !res.data) {
        setAlertMessage({
          type: 'error',
          text: res.error || 'خطا در تأیید درخواست بازیابی.',
        });
        return;
      }

      setApprovedClaimModal({
        targetStaffName: req.targetStaff.fullName,
        claimToken: res.data.claimToken,
        requestId: req.id,
      });

      // Remove from pending list
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    setIsSubmittingReject(true);
    setAlertMessage(null);

    try {
      const res = await rejectRecoveryAction({
        requestId: rejectingItem.id,
        reason: rejectionReason.trim(),
      });

      if (!res.success) {
        setAlertMessage({
          type: 'error',
          text: res.error || 'خطا در رد درخواست بازیابی.',
        });
        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== rejectingItem.id));
      setRejectingItem(null);
      setAlertMessage({
        type: 'success',
        text: `درخواست بازیابی کارمند ${rejectingItem.targetStaff.fullName} رد شد.`,
      });
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {alertMessage && (
        <Alert type={alertMessage.type}>{alertMessage.text}</Alert>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="py-12 text-center text-stone-400 space-y-3">
          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/80" aria-hidden="true" />
          <p className="text-sm font-semibold text-stone-700">
            هیچ درخواست بازیابی اضطراری در صف بررسی وجود ندارد.
          </p>
          <p className="text-xs text-stone-400">
            تمامی درخواست‌های پیشین تأیید یا تعیین تکلیف شده‌اند.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => {
            const isSelfRequest = req.targetStaffId === currentStaffId;

            return (
              <Card
                key={req.id}
                className={`p-5 space-y-4 border ${
                  isSelfRequest ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {req.targetStaff.fullName}
                        </span>
                        <span className="font-mono text-xs text-stone-400" dir="ltr">
                          @{req.targetStaff.username}
                        </span>
                        <Badge role={req.targetStaff.role} size="sm">
                          {req.targetStaff.role}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono mt-0.5" dir="ltr">
                        شناسه: {req.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      ثبت شده در: {new Date(req.createdAt).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* Requester note */}
                <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-700 leading-relaxed border border-stone-100">
                  <span className="font-semibold text-stone-900 block mb-1">علت و یادداشت درخواست:</span>
                  <p>{req.requesterNote}</p>
                </div>

                {/* Actions & Anti-self badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {isSelfRequest ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/70 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      این درخواست متعلق به شماست. باید توسط یک مدیر مستقل دیگر تأیید شود.
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400">
                      پس از تأیید، توکن تحویل امن یک‌بارمصرف صادر خواهد شد.
                    </span>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectingItem(req);
                        setRejectionReason('');
                      }}
                      className="text-xs px-3 py-1.5 text-rose-900 border-stone-300 hover:bg-stone-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 ml-1 text-stone-500" />
                      رد درخواست
                    </Button>

                    <Button
                      variant="primary"
                      disabled={isSelfRequest || approvingId === req.id}
                      loading={approvingId === req.id}
                      onClick={() => handleApprove(req)}
                      className="text-xs px-3.5 py-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 ml-1" />
                      تأیید و صدور توکن تحویل
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Display Claim Token on Approval */}
      <Modal
        isOpen={!!approvedClaimModal}
        onClose={() => setApprovedClaimModal(null)}
        title="تأیید موفق و صدور توکن تحویل (Claim Token)"
        description="توکن زیر را کپی کرده و به کارمند مورد نظر تحویل دهید تا در صفحه بازیابی اضطراری وارد نماید."
      >
        {approvedClaimModal && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
              <span className="font-bold block">
                درخواست بازیابی برای: {approvedClaimModal.targetStaffName}
              </span>
              <p className="text-stone-600">
                توجه: مدیران ارشد به سکرت یا کدهای اختصاصی کارمند دسترسی نخواهند داشت. این توکن یک‌بارمصرف به کارمند اجازه می‌دهد سکرت و کدهای جدید را شخصاً دریافت کند.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                توکن تحویل امن (Claim Token):
              </label>
              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-300 rounded-xl">
                <span className="font-mono text-xs text-stone-900 break-all select-all font-bold" dir="ltr">
                  {approvedClaimModal.claimToken}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(approvedClaimModal.claimToken)}
                  className="mr-2 inline-flex items-center gap-1 text-xs text-rose-900 hover:text-rose-800 font-semibold px-2.5 py-1 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition cursor-pointer flex-shrink-0"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedToken ? 'کپی شد' : 'کپی توکن'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setApprovedClaimModal(null)}
              >
                متوجه شدم و توکن را کپی کردم
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Rejection Reason */}
      <Modal
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="رد درخواست بازیابی اضطراری"
        maxWidth="sm"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-stone-600">
            علت رد درخواست بازیابی کارمند{' '}
            <strong>{rejectingItem?.targetStaff.fullName}</strong> را بنویسید:
          </p>

          <Textarea
            id="rejectionReason"
            label="دلیل رد درخواست"
            required
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="مثال: هویت کارمند پس از تماس حضوری احراز نشد..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectingItem(null)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isSubmittingReject}
            >
              رد قطعی درخواست
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
