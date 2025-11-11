import { alpha } from '@mui/material/styles';


const PRIMARY = {
  translucent: 'rgba(255, 217, 194, 0.5)',
  lighter: '#FFD9C2',  
  light: '#FFA373',    
  main: '#FD7622',
  dark: '#C35519',
  darker: '#833813',
  contrastText: '#fff'
};

const SECONDARY = {
  translucent: 'rgba(170, 170, 170, 0.5)',
  lighter: '#AAAAAA',  
  light: '#777777',
  main: '#555555',
  dark: '#333333',
  darker: '#111111',
  contrastText: '#fff'
}

const GREY = {
  0: '#FFFFFF',
  100: '#F5F5F5',
  200: '#E0E0E0',
  300: '#BDBDBD',
  400: '#9E9E9E',
  500: '#757575',
  600: '#616161',
  700: '#424242',
  800: '#303030',
  900: '#212121',
};

const INFO = {
  lighter: '#DCE3E8',
  light: '#A6B3C1',
  main: '#738A9E',
  dark: '#4A6374',
  darker: '#2A3E48',
  contrastText: '#fff'
};

const SUCCESS = {
  lighter: '#E3F2E5',
  light: '#A8D4A0',
  main: '#6EBF5A',
  dark: '#49903A',
  darker: '#2D5D22',
  contrastText: '#fff'
};

const WARNING = {
  lighter: '#FFE8D2',
  light: '#FFB382',
  main: '#FF7F3A',
  dark: '#CC5C27',
  darker: '#8A3D18',
  contrastText: '#212121'
};

const ERROR = {
  lighter: '#FCE4E4',
  light: '#F8A5A5',
  main: '#F26363',
  dark: '#D12F2F',
  darker: '#8E1F1F',
  contrastText: '#fff'
};


const palette = {
  common: { black: '#000', white: '#fff' },
  primary: PRIMARY,
  secondary: SECONDARY,
  info: INFO,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  grey: GREY,
  divider: alpha(GREY[500], 0.24),
  text: {
    primary: GREY[800],
    secondary: GREY[600],
    disabled: GREY[500],
  },
  background: {
    paper: '#fff',
    default: GREY[100],
    neutral: GREY[200],
  },
  action: {
    active: GREY[600],
    hover: alpha(GREY[500], 0.08),
    selected: alpha(GREY[500], 0.16),
    disabled: alpha(GREY[500], 0.8),
    disabledBackground: alpha(GREY[500], 0.24),
    focus: alpha(GREY[500], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

export default palette;
