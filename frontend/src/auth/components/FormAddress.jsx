/* eslint-disable react/prop-types */
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';
import { useWatch } from 'react-hook-form';
import useCEP from '../hooks/useCEP';

const estados = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MS',
  'MT',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

function FormAdress({ form, error }) {
  const {
    estado,
  } = useWatch({ control: form?.control });
  const { isValid } = useCEP(form.watch('CEP'), form);

  return (
    <FormControl sx={{ width: '100%', gap: 3, mb: 4 }}>
      <TextField
        fullWidth
        name="CEP"
        required
        label="CEP"
        placeholder="Digite o CEP da sua região"
        {...form.register("CEP", {
          onChange: () => {
            if (error?.CEP) {
              form?.clearErrors('CEP')
            }
          }, 
          minLength: 8
        })}
      />
      {isValid && (
        <>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              name="rua"
              label="Logradouro"
              required
              InputLabelProps={{
                shrink: true
              }}
              {...form.register("rua")}
              error={!!error?.rua}
              helperText={error?.rua?.[0]}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <TextField
                fullWidth
                name="numero"
                label="Número"
                required
                {...form.register("numero", {
                  onChange: () => {
                    if (error?.numero?.length) {
                      form?.clearErrors('numero')
                    }
                  }
                })}
                error={!!error?.numero}
                helperText={error?.numero?.[0]}
              />
            </FormControl>
          </Box>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              name="complemento"
              label="complemento"
              error={!!error?.complemento}
              helperText={error?.complemento?.[0]}
          
              {...form.register("complemento")}
            />
            <TextField
              fullWidth
              name="bairro"
              label="Bairro"
              required
              InputLabelProps={{
                shrink: true
              }}
              {...form.register("bairro")}
              error={!!error?.bairro}
              helperText={error?.bairro?.[0]}
            />
          </Box>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              name="cidade"
              label="Cidade"
              required
              InputLabelProps={{
                shrink: true
              }}
              {...form.register("cidade")}
              error={!!error?.cidade}
              helperText={error?.cidade?.[0]}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="label">Estado</InputLabel>
              <Select
                labelId="label"
                required
                label="Estado"
                InputLabelProps={{
                  shrink: true
                }}
                {...form.register("estado")}
                value={estado}
                error={!!error?.estado}
                helperText={error?.estado?.[0]}
              >
                {estados.map((sigla) => (
                  <MenuItem key={sigla} value={sigla}>
                    {sigla}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      )}
    </FormControl>
  );
}

export default FormAdress;
