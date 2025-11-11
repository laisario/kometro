export const useQuery = jest.fn(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
}));

export const useMutation = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isLoading: false,
  isError: false,
  error: null,
  data: undefined,
  reset: jest.fn(),
}));

export const useQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
}));

export const QueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
}));

export const QueryClientProvider = ({ children }) => children;
