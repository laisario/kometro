import { useState } from "react";
import { Box, Button, Chip, List, TextField } from "@mui/material";

function AddArrayField({ label, fieldName, form }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const currentValues = form.getValues(fieldName) || [];
    form.setValue(fieldName, [...currentValues, inputValue]);
    setInputValue('');
  };

  const handleRemove = (indexToRemove) => {
    const currentValues = form.getValues(fieldName);
    const newValues = currentValues?.filter((_, index) => index !== indexToRemove);
    form.setValue(fieldName, newValues);
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
          <Chip
            label={value}
            sx={{ m: 0.5 }}
            onDelete={() => handleRemove(index)}
            key={index}
          />
        ))}
      </List>
    </Box>
  );
}

export default AddArrayField;