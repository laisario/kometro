import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router';
import { Box, Link } from '@mui/material';
import useAuth from '../auth/hooks/useAuth';


const Logo = forwardRef(({ disabledLink = false, sx }, ref) => {
  const { user } = useAuth();
  const admin = user?.admin;

  const logo = (
    <Box
      component="img"
      alt="Logo"
      src="/assets/images/logo.png"
      sx={{ cursor: !disabledLink && 'pointer',  ...sx }}
    />
  );


  if (disabledLink) {
    return <>{logo}</>;
  }

  return (
    <Link to={admin ? "/admin" : '/dashboard'} component={RouterLink} sx={{ display: 'contents' }}>
      {logo}
    </Link>
  );
});

Logo.propTypes = {
  sx: PropTypes.object,
  disabledLink: PropTypes.bool,
};

export default Logo;
