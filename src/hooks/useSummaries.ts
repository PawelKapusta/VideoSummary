import { useState, useEffect, useCallback } from 'react';
import type { SummaryWithVideo, ApiError, PaginatedResponse } from '@/types';
import { apiClient, ApiClientError } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

const useSummaries = () => {
  const [summaries, setSummaries] = useState<SummaryWithVideo[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<ApiClientError | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchSummaries = useCallback(async (currentOffset: number) => {
    setStatus('loading');
    setError(null);

    try {
      const data = await apiClient.get<PaginatedResponse<SummaryWithVideo>>(
        `/api/summaries?limit=${limit}&offset=${currentOffset}`,
      );

      setSummaries((prev) => (currentOffset === 0 ? data.data : [...prev, ...data.data]));
      setHasMore(data.pagination.offset + data.data.length < data.pagination.total);
      setOffset(currentOffset + data.data.length);
      setStatus('success');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err);
      } else {
        setError(new ApiClientError('UNKNOWN_ERROR', 'An unexpected error occurred.'));
      }
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchSummaries(0);
  }, [fetchSummaries]);

  const loadMore = () => {
    if (status !== 'loading' && hasMore) {
      fetchSummaries(offset);
    }
  };

  return { summaries, status, error, hasMore, loadMore };
};

export default useSummaries;
