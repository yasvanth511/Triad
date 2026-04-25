'use client';

import { useEffect, useState } from 'react';
import { fetchAllUsers } from '@/lib/api';
import { buildGeographyAnalytics } from '@/lib/geography';
import type { GeographyAnalytics } from '@/lib/geography';
import { formatPercentage } from '@/lib/format';
import MetricCard from '@/components/MetricCard';
import RankList from '@/components/RankList';
import StateCard from '@/components/StateCard';

export default function GeographyPage() {
  const [analytics, setAnalytics] = useState<GeographyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllUsers()
      .then((items) => {
        setAnalytics(buildGeographyAnalytics(items));
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'The admin API request failed.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <StateCard
        title="Loading geography analytics"
        body="Aggregating coarse geography from the admin user summary."
      />
    );
  }
  if (error) {
    return <StateCard title="Unable to load geography analytics" body={error} />;
  }
  if (!analytics || analytics.totalUsers === 0) {
    return (
      <StateCard
        title="No geography data yet"
        body="The admin API returned an empty user list."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <MetricCard
          label="Total Users"
          value={analytics.totalUsers}
          description="Users included in the coarse geography rollup."
        />
        <MetricCard
          label="State Coverage"
          value={formatPercentage(analytics.stateCoverageRatio)}
          description={`${analytics.stateCoverageCount} users include a state or region.`}
        />
        <MetricCard
          label="City Coverage"
          value={formatPercentage(analytics.cityCoverageRatio)}
          description={`${analytics.cityCoverageCount} users include a city.`}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <RankList
          title="Users by Country"
          rows={analytics.countryRows}
          total={analytics.totalUsers}
          emptyMessage="Country data is not available in the current admin user summary."
        />
        <RankList
          title="Users by State/Region"
          rows={analytics.stateRows}
          total={analytics.totalUsers}
          emptyMessage="No state or region data is available."
        />
        <RankList
          title="Users by City"
          rows={analytics.cityRows}
          total={analytics.totalUsers}
          emptyMessage="No city data is available."
        />
      </div>
    </div>
  );
}
