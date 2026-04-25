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
      <dt className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--color-muted-ink)]">
        {label}
      </dt>
      <dd className="m-0 text-sm text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-white/65 bg-white/55 p-4 backdrop-blur-md">
      <h3 className="m-0 text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      <dl className="grid gap-3 mt-3.5">{children}</dl>
    </section>
  );
}

function TimestampValue({ value }: { value?: string }) {
  const formatted = formatTimestamp(value);
  if (!formatted) return <span className="text-[var(--color-muted-ink)]">Unavailable</span>;
  return <span className="text-sm">{formatted}</span>;
}

function VerificationItem({ item }: { item: VerificationSummaryItem }) {
  return (
    <article className="rounded-2xl border border-white/65 bg-white/75 p-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2.5">
        <strong className="text-sm text-[var(--color-ink)]">{item.method ?? 'Unknown'}</strong>
        <StatusPill value={item.status ?? 'Unknown'} type="verification" />
      </div>
      {(typeof item.isEnabled === 'boolean' || item.verifiedAt || item.expiresAt) && (
        <dl className="grid gap-2.5 mt-3">
          {typeof item.isEnabled === 'boolean' && (
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--color-muted-ink)]">
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
              <dt className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--color-muted-ink)]">
                Verified
              </dt>
              <dd className="m-0">
                <TimestampValue value={item.verifiedAt} />
              </dd>
            </div>
          )}
          {item.expiresAt && (
            <div className="grid gap-1">
              <dt className="text-xs font-semibold tracking-[0.08em] uppercase text-[var(--color-muted-ink)]">
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
          {detail.displayName ?? <span className="text-[var(--color-muted-ink)]">Unavailable</span>}
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

      <section className="rounded-[22px] border border-white/65 bg-white/55 p-4 backdrop-blur-md">
        <h3 className="m-0 text-sm font-semibold text-[var(--color-ink)]">Verification Summary</h3>
        {!Array.isArray(detail.verificationSummary) || detail.verificationSummary.length === 0 ? (
          <p className="mt-3.5 mb-0 text-[var(--color-muted-ink)] text-sm">
            No verification methods.
          </p>
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
            <span className="text-[var(--color-muted-ink)]">None</span>
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
          {detail.geographySummary ?? <span className="text-[var(--color-muted-ink)]">Unavailable</span>}
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
    <aside className="admin-card sticky top-3 max-h-[calc(100vh-2rem)] overflow-y-auto p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-[var(--color-muted-ink)]">
            User Detail
          </p>
          <h3 className="m-0 text-base font-bold text-[var(--color-ink)]">
            {displayName ?? 'User details'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center justify-center rounded-2xl border border-white/70 bg-white/60 px-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-white/80"
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
