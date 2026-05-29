import { useState } from "react";
import { Box, Button, Chip, List, TextField } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

function AddArrayField({ label, fieldName, form, onRemoveItem, deletingItems = {} }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const currentValues = form.getValues(fieldName) || [];
    const value = inputValue.trim();
    if (!value) return;
    form.setValue(fieldName, [...currentValues, { nome: value }]);
    setInputValue('');
  };

  const removeFromState = (itemToRemove, indexToRemove) => {
    const currentValues = form.getValues(fieldName);
    const newValues = currentValues?.filter((value, index) => {
      if (itemToRemove?.id) {
        return value?.id !== itemToRemove.id;
      }
      return index !== indexToRemove;
    });
    form.setValue(fieldName, newValues);
  };

  const handleRemove = async (item, indexToRemove) => {
    if (onRemoveItem) {
      await onRemoveItem(item, () => removeFromState(item, indexToRemove));
      return;
    }
    removeFromState(item, indexToRemove);
  };

  const values = form.watch(fieldName) || [];

  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Box display="flex" flexDirection="row" width="100%" gap={2}>
        <TextField
          label={label}
          variant="outlined"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          size="small"
          sx={{ width: '80%' }}
          helperText="Um de cada vez"
        />
        <Button onClick={handleAdd} variant="contained" size="small" sx={{ width: '20%' }}>
          Adicionar
        </Button>
      </Box>
      <List sx={{ mt: 1, overflowX: 'auto' }}>
        {values?.map((value, index) => (
          (() => {
            const item = typeof value === 'string' ? { nome: value } : value;
            const itemKey = item?.id ?? `${item?.nome}-${index}`;
            const isDeleting = !!(item?.id && deletingItems[item.id]);

            return (
              <Chip
                label={item?.nome || ''}
                sx={{ m: 0.5 }}
                onDelete={isDeleting ? () => {} : () => handleRemove(item, index)}
                deleteIcon={isDeleting ? <CircularProgress size={16} /> : undefined}
                key={itemKey}
              />
            );
          })()
        ))}
      </List>
    </Box>
  );
}

export default AddArrayField;
