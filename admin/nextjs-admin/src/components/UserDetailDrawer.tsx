'use client';

import { useEffect, useState } from 'react';
import { fetchUserDetail } from '@/lib/api';
import type { UserDetail, VerificationSummaryItem } from '@/lib/types';
import { formatTimestamp } from '@/lib/format';
import StateCard from './StateCard';
import StatusPill from './StatusPill';

interface Props {
  userId: string | number;
  displayName?: string;
  onClose: () => void;
}

function getModerationStatus(user: UserDetail): string {
  if (typeof user.moderationStatus === 'string' && user.moderationStatus.trim()) {
    return user.moderationStatus.trim();
  }
  if (user.isUnderReview === true || user.underReview === true) return 'Under Review';
  if (user.isFlagged === true || user.flagged === true) return 'Flagged';
  return '';
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <dt className="text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#eef2f8] border border-[#d9e0ec] rounded-[18px] p-4">
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      <dl className="grid gap-3 mt-3.5">{children}</dl>
    </section>
  );
}

function TimestampValue({ value }: { value?: string }) {
  const formatted = formatTimestamp(value);
  if (!formatted) return <span className="text-[#667085]">Unavailable</span>;
  return <span className="text-sm">{formatted}</span>;
}

function VerificationItem({ item }: { item: VerificationSummaryItem }) {
  return (
    <article className="border border-[#d9e0ec] rounded-xl p-3 bg-white">
      <div className="flex items-center justify-between gap-2.5">
        <strong className="text-sm">{item.method ?? 'Unknown'}</strong>
        <StatusPill value={item.status ?? 'Unknown'} type="verification" />
      </div>
      {(typeof item.isEnabled === 'boolean' || item.verifiedAt || item.expiresAt) && (
        <dl className="grid gap-2.5 mt-3">
          {typeof item.isEnabled === 'boolean' && (
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
                Availability
              </dt>
              <dd className="m-0">
                <StatusPill
                  value={item.isEnabled ? 'Enabled' : 'Disabled'}
                  type="availability"
                />
              </dd>
            </div>
          )}
          {item.verifiedAt && (
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
                Verified
              </dt>
              <dd className="m-0">
                <TimestampValue value={item.verifiedAt} />
              </dd>
            </div>
          )}
          {item.expiresAt && (
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
                Expires
              </dt>
              <dd className="m-0">
                <TimestampValue value={item.expiresAt} />
              </dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

function DetailBody({ detail }: { detail: UserDetail }) {
  const moderationStatus = getModerationStatus(detail);

  return (
    <div className="grid gap-3">
      <DetailSection title="Account">
        <DetailRow label="User ID">
          <span className="font-mono text-[13px]">{String(detail.id ?? 'Unavailable')}</span>
        </DetailRow>
        <DetailRow label="Display Name">
          {detail.displayName ?? <span className="text-[#667085]">Unavailable</span>}
        </DetailRow>
        <DetailRow label="Account Status">
          <StatusPill value={detail.accountStatus ?? 'Unknown'} type="account" />
        </DetailRow>
        <DetailRow label="Profile Type">
          <StatusPill value={detail.profileType ?? 'Unknown'} type="profile" />
        </DetailRow>
        <DetailRow label="Online">
          <StatusPill value={detail.onlineStatus ?? 'Unknown'} type="online" />
        </DetailRow>
      </DetailSection>

      <section className="bg-[#eef2f8] border border-[#d9e0ec] rounded-[18px] p-4">
        <h3 className="m-0 text-sm font-semibold">Verification Summary</h3>
        {!Array.isArray(detail.verificationSummary) || detail.verificationSummary.length === 0 ? (
          <p className="mt-3.5 mb-0 text-[#667085] text-sm">No verification methods.</p>
        ) : (
          <div className="grid gap-2.5 mt-3.5">
            {detail.verificationSummary.map((item, i) => (
              <VerificationItem key={i} item={item} />
            ))}
          </div>
        )}
      </section>

      <DetailSection title="Moderation Summary">
        <DetailRow label="Report Count">{String(detail.reportCount ?? 0)}</DetailRow>
        <DetailRow label="Report Reasons">
          {!Array.isArray(detail.reportReasons) || detail.reportReasons.length === 0 ? (
            <span className="text-[#667085]">None</span>
          ) : (
            <ul className="m-0 pl-4">
              {detail.reportReasons.map((r, i) => (
                <li key={i} className="mt-1.5 text-sm">
                  {r.reason ?? 'Unknown'} ({r.count ?? 0})
                </li>
              ))}
            </ul>
          )}
        </DetailRow>
        <DetailRow label="Block Count">{String(detail.blockCount ?? 0)}</DetailRow>
        {moderationStatus && (
          <DetailRow label="Current Status">
            <StatusPill value={moderationStatus} type="moderation" />
          </DetailRow>
        )}
      </DetailSection>

      <DetailSection title="Context">
        <DetailRow label="Geography">
          {detail.geographySummary ?? <span className="text-[#667085]">Unavailable</span>}
        </DetailRow>
        <DetailRow label="Created">
          <TimestampValue value={detail.createdAt} />
        </DetailRow>
        {detail.lastActiveAt && (
          <DetailRow label="Last Active">
            <TimestampValue value={detail.lastActiveAt} />
          </DetailRow>
        )}
      </DetailSection>
    </div>
  );
}

export default function UserDetailDrawer({ userId, displayName, onClose }: Props) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    setLoading(true);

    fetchUserDetail(userId)
      .then((d) => {
        if (!cancelled) {
          setDetail(d);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'The admin API request failed.',
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <aside className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] sticky top-3 overflow-y-auto max-h-[calc(100vh-2rem)]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
            User Detail
          </p>
          <h3 className="m-0 text-base font-bold">{displayName ?? 'User details'}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#d9e0ec] rounded-[10px] bg-white text-[#1d4ed8] px-2.5 py-2 cursor-pointer text-sm font-semibold shrink-0"
          aria-label="Close user detail"
        >
          Close
        </button>
      </div>

      {loading && (
        <StateCard title="Loading detail" body="Fetching the admin-safe user summary." />
      )}
      {!loading && error && <StateCard title="Unable to load detail" body={error} />}
      {!loading && !error && detail && <DetailBody detail={detail} />}
    </aside>
  );
}
