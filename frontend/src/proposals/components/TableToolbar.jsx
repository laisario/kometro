import { useState } from 'react';
import { 
  Grid, 
  IconButton, 
  InputAdornment, 
  TextField, 
  Toolbar, 
  Tooltip, 
  Typography,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Search } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import useResponsive from '../../theme/hooks/useResponsive';
import FilterSidebar from '../../components/FilterSidebar';

function TableToolbar(props) {
  const [filter, setFilter] = useState(false);

  const { 
    numSelected, 
    form, 
    selectedOrders, 
    admin, 
    setSelectedOrders, 
    deleteOrder, 
    isMobile
  } = props;

  const isDesktop = useResponsive('up', 'md');

  const resetFilters = () => {
    form.reset()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: isDesktop ? 1 : 2,
        }}
    >
      {admin && numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected.length > 1 ? `${numSelected} selecionados` : `${numSelected} selecionado`}
        </Typography>
      ) : (
            <Grid container display="flex" justifyContent="space-between" alignItems="center">
              <Grid item sm={6} xs={8}>
                <TextField
                  label='Busque'
                  {...form.register("search")}
                  name="search"
                  placeholder={admin ? 'Cliente ou número' : 'Número'}
                  id='search-bar'
                  fullWidth
                  size='small'
                  InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Search />
                        </InputAdornment>
                      ),
                  }}
                />
              </Grid>
              <Grid item sm={2} >
                <FilterSidebar
                  openFilter={filter}
                  onOpenFilter={() => setFilter(true)}
                  onCloseFilter={() => setFilter(false)}
                  form={form}
                  resetFilters={resetFilters}
                  children={(          
                    <Stack spacing={3} sx={{ p: 3 }}>
                      <div>
                        <FormControl>
                          <FormLabel id="status-filter">Status</FormLabel>
                          <RadioGroup
                            row
                            aria-labelledby="status-filter"
                            name="status"
                            value={form?.watch(status)}
                            onChange={(e) => form?.setValue('status', e?.target?.value)}
                          >
                            <FormControlLabel value="E" control={<Radio {...form.register("status")} />} label="Em elaboração" />
                            <FormControlLabel value="AA" control={<Radio {...form.register("status")} />} label="Aguardando aprovação" />
                            <FormControlLabel value="A" control={<Radio {...form.register("status")} />} label="Aprovada" />
                            <FormControlLabel value="R" control={<Radio {...form.register("status")} />} label="Reprovada" />
                          </RadioGroup>
                        </FormControl>
                      </div>
          
                      <Divider />
          
                      <div>
                        <Typography variant="subtitle1" gutterBottom>
                          Datas
                        </Typography>
                        <DatePicker
                          label="Ínicio"
                          name="dateStart"
                          {...form.register("dateStart")}
                          value={form?.dateStart}
                          onChange={newValue => form.setValue("dateStart", newValue)}
                        />
                        <DatePicker
                          label="Fim"
                          name="dateStop"
                          {...form.register("dateStop")}
                          value={form?.dateStop}
                          onChange={newValue => form.setValue("dateStop", newValue)}
                          sx={{my: 1}}
                        />
                        <Button variant="contained" fullWidth onClick={() => form.setValue("filterByDate", true)} >Filtrar</Button>
                      </div>
                    </Stack>
                  )}
                />
              </Grid>
            </Grid>
        )}

        {admin && numSelected > 0 && (
          <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon onClick={() => { deleteOrder(selectedOrders); setSelectedOrders([]) }} />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </LocalizationProvider>
);
}

export default TableToolbar