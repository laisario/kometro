import {
  Box,
  Button,
  Drawer,
  Divider,
  IconButton,
  Typography,
  Stack,
} from '@mui/material';
import 'dayjs/locale/pt-br'
import Iconify from './Iconify';
import Scrollbar from './scrollbar';


export default function FilterSidebar({ openFilter, onOpenFilter, onCloseFilter, resetFilters, form, children }) {
  return (
    <>
      <Button disableRipple color="inherit" endIcon={<Iconify icon="ic:round-filter-list" />} onClick={onOpenFilter}>
        Filtros
      </Button>

      <Drawer
        anchor="right"
        open={openFilter}
        onClose={onCloseFilter}
        PaperProps={{
          sx: { width: 280, border: 'none', overflow: 'hidden' },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
          <Typography variant="subtitle1" sx={{ ml: 1 }}>
            Filtros
          </Typography>
          <IconButton onClick={onCloseFilter}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>

        <Divider />

        <Scrollbar>
          {children}
        </Scrollbar>

        <Box sx={{ p: 3 }}>
          <Button
            fullWidth
            size="large"
            type="submit"
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="ic:round-clear-all" />}
            onClick={resetFilters}
          >
            Limpar filtros
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
