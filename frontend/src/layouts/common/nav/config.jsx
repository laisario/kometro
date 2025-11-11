import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HomeIcon from '@mui/icons-material/Home';
import ScaleIcon from '@mui/icons-material/Scale';
import DescriptionIcon from '@mui/icons-material/Description';
import Groups2Icon from '@mui/icons-material/Groups2';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

export const navConfig = (admin, hasPermission) => {
  const data = [
    {
      title: 'página inicial',
      path: `/${admin? "admin" : "dashboard"}/app`,
      icon: <HomeIcon />,
    },
    {
      title: admin ? 'Clientes' : 'Instrumentos',
      path: admin ? '/admin/clientes' : '/dashboard/instrumentos',
      icon: admin ?  <Groups2Icon /> : <ScaleIcon />,
    },
    {
      title: 'Propostas',
      path: `/${admin? "admin" : "dashboard"}/propostas`,
      icon: <ShoppingCartIcon />,
    },
    {
      title: 'Documentos',
      path: `/${admin? "admin" : "dashboard"}/documentos`,
      icon: <DescriptionIcon />
    },
  ]
  if (hasPermission) {
    data.push({
      title: 'Acessos',
      path: `/${admin? "admin" : "dashboard"}/acessos`,
      icon: <GroupAddIcon />
    })
  }
  return data
};

