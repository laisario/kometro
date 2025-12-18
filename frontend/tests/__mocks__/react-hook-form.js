export const useForm = jest.fn(() => ({
  register: jest.fn(() => ({})),
  handleSubmit: jest.fn((fn) => fn),
  watch: jest.fn(),
  setValue: jest.fn(),
  getValues: jest.fn(() => ({})),
  reset: jest.fn(),
  formState: {
    errors: {},
    isSubmitting: false,
  },
  control: {},
}));

export const useWatch = jest.fn(() => ({}));

export const useFieldArray = jest.fn(() => ({
  fields: [],
  append: jest.fn(),
  remove: jest.fn(),
  prepend: jest.fn(),
  insert: jest.fn(),
  swap: jest.fn(),
  move: jest.fn(),
  update: jest.fn(),
  replace: jest.fn(),
}));

export const Controller = ({ render, name, control, defaultValue }) => {
  return render({ 
    field: { 
      onChange: jest.fn(), 
      onBlur: jest.fn(), 
      value: defaultValue || '', 
      name, 
      ref: jest.fn() 
    },
    fieldState: { invalid: false, error: undefined },
    formState: { errors: {}, isSubmitting: false },
  });
};
