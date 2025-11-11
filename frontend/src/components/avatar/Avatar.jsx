import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import useAuth from '../../auth/hooks/useAuth';

const AvatarComponent = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const fullname = user?.nome?.split(" ").filter((_name,index) => index === 0 || index === 1)
  return (
    <Avatar sx={{ bgcolor: theme.palette.secondary.dark }}>{fullname?.map((name) => name[0].toUpperCase())}</Avatar>
  );
};

export default AvatarComponent;
