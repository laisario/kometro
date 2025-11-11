import { Route, Navigate, Routes } from 'react-router';
import CommonLayout from '../layouts/common/CommonLayout.jsx';
import SimpleLayout from '../layouts/simple/SimpleLayout.jsx';
import AssetsPage from '../assets/pages/AssetsPage.jsx';
import DashboardPage from '../dashboard/pages/DashboardPage.jsx';
import ProposalsPage from '../proposals/pages/ProposalsPage.jsx';
import ProposalDetailsPage from '../proposals/pages/ProposalDetailsPage.jsx';
import Page404 from '../dashboard/pages/Page404.jsx';
import DocumentsPage from '../documents/pages/DocumentsPage.jsx';
import DocumentDetailPage from '../documents/pages/DocumentDetailPage.jsx';
import DocumentReviews from '../documents/pages/DocumentReviews.jsx';
import ClientsPage from '../clients/pages/ClientsPage.jsx';
import ClientDetailsPage from '../clients/pages/ClientDetailsPage.jsx';
import AuthLayout from '../layouts/auth/AuthLayout'
import LoginPage from '../auth/pages/LoginPage'
import RegisterBasicsPage from '../auth/pages/RegisterBasicsPage'
import RegisterAuthPage from '../auth/pages/RegisterAuthPage'
import RegisterLocationPage from '../auth/pages/RegisterLocationPage'
import UserAccessPage from '../access/pages/UserAccessPage.jsx';
import RegisterFromInvite from '../auth/pages/ResgisterFromInvite.jsx';
import ResetPasswordRequestPage from '../auth/pages/ResetPasswordRequestPage.jsx';
import ResetPasswordPage from '../auth/pages/ResetPasswordPage.jsx';


export default function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Navigate to="/login" />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="reset-password-request" element={<ResetPasswordRequestPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/register" element={<AuthLayout />}>
        <Route index element={<Navigate to="/register/basics" />} />
        <Route path="basics" element={<RegisterBasicsPage />} />
        <Route path="auth" element={<RegisterAuthPage />} />
        <Route path="location" element={<RegisterLocationPage />} />
        <Route path="invite/:token" element={<RegisterFromInvite />} />
      </Route>

      <Route element={<SimpleLayout />}>
        <Route index element={<Navigate to="/dashboard/app" />} />
        <Route path="404" element={<Page404 />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Route>

      <Route path="/dashboard"  element={<CommonLayout />}>
        <Route index element={<Navigate to="/dashboard/app" />} />
        <Route path="app" element={<DashboardPage />} />
        <Route path="instrumentos" element={<AssetsPage />} />
        <Route path="instrumentos/:id/:idSetor" element={<AssetsPage />} />
        <Route path="propostas" element={<ProposalsPage />} />
        <Route path="proposta/:id" element={<ProposalDetailsPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="documento/:id/:idRevisao" element={<DocumentDetailPage />} />
        <Route path="documento/:id/revisoes" element={<DocumentReviews />} />
        <Route path="acessos" element={<UserAccessPage />} />
      </Route>

      <Route path="/admin" element={<CommonLayout />}>
        <Route index element={<Navigate to="/admin/app" />} />
        <Route path="app" element={<DashboardPage />} />
        <Route path="propostas" element={<ProposalsPage />} />
        <Route path="proposta/:id/:idClient" element={<ProposalDetailsPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="documento/:id/:idRevisao" element={<DocumentDetailPage />} />
        <Route path="documento/:id/revisoes" element={<DocumentReviews />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="cliente/:id" element={<ClientDetailsPage />} />
        <Route path="acessos" element={<UserAccessPage />} />
      </Route>

      <Route element={<SimpleLayout />}>
        <Route index element={<Navigate to="/dashboard/app" />} />
        <Route path="404" element={<Page404 />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Route>

      <Route path="*" element={<Navigate to="/404" replace />} /> 
    </Routes>
  );
}
