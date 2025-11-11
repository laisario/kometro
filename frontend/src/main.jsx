import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import AuthProvider from './auth/provider';
import ThemeProvider from './theme';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import MainRouter from './routes/MainRouter.jsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
    <HelmetProvider>
      <HashRouter>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider maxSnack={3}>
              <AuthProvider>
                <MainRouter />
              </AuthProvider>
            </SnackbarProvider> 
          </QueryClientProvider>
        </ThemeProvider>
      </HashRouter>
    </HelmetProvider>
);
