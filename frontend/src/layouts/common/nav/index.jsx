import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { styled, alpha } from '@mui/material/styles';
import { Box, Link, Button, Drawer, Typography, Stack } from '@mui/material';
import useResponsive from '../../../theme/hooks/useResponsive';
import Logo from '../../../components/Logo';
import Scrollbar from '../../../components/scrollbar';
import NavSection from '../../../components/nav-section';
import { Avatar } from '../../../components/avatar'
import Iconify from '../../../components/Iconify';
import useAuth from '../../../auth/hooks/useAuth';
import {navConfig} from './config';
import { permissionLabel } from '../../../utils/permission';


const NAV_WIDTH = 280;

const StyledAccount = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 2.5),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: alpha(theme.palette.grey[500], 0.12),
}));


Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
  admin: PropTypes.bool,
};

export default function Nav({ openNav, onCloseNav, admin }) {
  const { pathname } = useLocation();
  const { user, isManager } = useAuth();

  const isDesktop = useResponsive('up', 'lg');
  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
  }, [pathname]);

  const renderContent = (
    <Scrollbar
      rootSx={{
        "& .simplebar-mask": {
          height: '100vh'
        },
        "& .simplebar-offset": {
          height: '100%'
        },
        "& .simplebar-content-wrapper": {
          height: '100% !important'
        },
        "& .simplebar-content": {
          height: '100% !important'
        },
      }}
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: '100%',
      }}
    >
      <Box>
        <Box px={5} sx={{ display: 'inline-flex', justifyContent: 'center' }}>
          <Logo />
        </Box>

        <Box sx={{ my: 5, mx: 2.5 }}>
            <StyledAccount>
              <Avatar size={36} />

              <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary', whiteSpace: 'normal', wordBreak: 'break-word', }}>
                  {user?.nome || ''} 
                </Typography>

                <Box sx={{ mt: 0.5 }}>
                  {user?.roles?.length ? (
                    user.roles.map((r, i) => (
                      <Typography
                        key={i}
                        variant="caption"
                        sx={{ color: 'text.secondary', display: 'block' }}
                      >
                        {user?.roles?.length > 1 ? 'Permissões: ' : 'Permissão: '}{permissionLabel[r?.name]}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      Sem permissões
                    </Typography>
                  )}
                </Box>
              </Box>
            </StyledAccount>
        </Box>

        <NavSection data={navConfig(admin, isManager)} />
      </Box>
      {!admin 
        ? (
          <Stack alignItems="center" spacing={3} px={2}>
            <Box
              component="img"
              src="/assets/illustrations/illustration_avatar.png"
              sx={{ width: 100 }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography gutterBottom variant="h6">
                Precisando
                  de uma calibração ai?
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Calibre seus instrumentos a partir de R$ 35,00
              </Typography>
            </Box>

            <Button href="#/dashboard/propostas" startIcon={<Iconify icon="eva:plus-fill" />} variant="contained">
              Nova proposta
            </Button>
          </Stack>
        )
        : <Box />
      }
    </Scrollbar>
  );

  return (
    <Box
      component="nav"
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV_WIDTH },
      }}
    >
      {isDesktop ? (
        <Drawer
          open
          variant="permanent"
          PaperProps={{
            sx: {
              width: NAV_WIDTH,
              bgcolor: 'background.default',
              borderRightStyle: 'dashed',
            },
          }}
        >
          {renderContent}
        </Drawer>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: { width: NAV_WIDTH },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
