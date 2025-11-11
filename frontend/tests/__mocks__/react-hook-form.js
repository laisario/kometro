export const useForm = jest.fn(() => ({
  register: jest.fn(() => ({})),
  handleSubmit: jest.fn((fn) => fn),
  watch: jest.fn(),
  setValue: jest.fn(),
  getValues: jest.fn(),
  reset: jest.fn(),
  formState: {
    errors: {},
    isSubmitting: false,
  },
  control: {},
}));

export const useWatch = jest.fn(() => ({}));
