/**
 * useTrpcQuery - lightweight React hook for tRPC queries.
 * No dependency on @tanstack/react-query - uses vanilla fetch via @trpc/client.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook that wraps an async tRPC call in React state.
 * Usage: const { data, isLoading, isError } = useTrpcQuery(() => trpc.roles.listPublished.query({ limit: 20 }));
 */
export function useTrpcQuery<T>(
  queryFn: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const result = await queryFn();
      if (mountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
        setIsError(true);
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { data, isLoading, isError, error, refetch: fetch };
}

/**
 * Hook for tRPC mutations.
 */
interface MutationState<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>;
  data: TOutput | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useTrpcMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
): MutationState<TInput, TOutput> {
  const [data, setData] = useState<TOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const result = await mutationFn(input);
        setData(result);
        setIsLoading(false);
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
        setIsError(true);
        setIsLoading(false);
        throw err;
      }
    },
    [mutationFn],
  );

  return { mutate, data, isLoading, isError, error };
}
