import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';

const HomePage = lazy(() => import('../pages/HomePage.jsx'));
const CatalogPage = lazy(() => import('../pages/CatalogPage.jsx'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage.jsx'));
const ProductComparisonPage = lazy(() => import('../pages/ProductComparisonPage.jsx'));
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'));
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));
const RequisitionsPage = lazy(() => import('../pages/RequisitionsPage.jsx'));
const ApprovalsPage = lazy(() => import('../pages/ApprovalsPage.jsx'));
const OrdersPage = lazy(() => import('../pages/OrdersPage.jsx'));
const ReceiptsPage = lazy(() => import('../pages/ReceiptsPage.jsx'));
const InventoryPage = lazy(() => import('../pages/InventoryPage.jsx'));
const InvoicesPage = lazy(() => import('../pages/InvoicesPage.jsx'));
const PaymentsPage = lazy(() => import('../pages/PaymentsPage.jsx'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage.jsx'));
const PriceImportsPage = lazy(() => import('../pages/PriceImportsPage.jsx'));
const AdminMastersPage = lazy(() => import('../pages/AdminMastersPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

function RequireSession({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <SkeletonLoader
          rows={3}
          columns={3}
          label="Cargando módulo de aplicación..."
        />
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/products/:productId" element={<ProductDetailPage />} />
        <Route path="/catalog/products/:productId/comparison" element={<ProductComparisonPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Private Operational & Administrative Routes */}
        <Route
          path="/app"
          element={
            <RequireSession>
              <DashboardPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/requisitions"
          element={
            <RequireSession>
              <RequisitionsPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/approvals"
          element={
            <RequireSession>
              <ApprovalsPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/orders"
          element={
            <RequireSession>
              <OrdersPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/receipts"
          element={
            <RequireSession>
              <ReceiptsPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/inventory"
          element={
            <RequireSession>
              <InventoryPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/invoices"
          element={
            <RequireSession>
              <InvoicesPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/payments"
          element={
            <RequireSession>
              <PaymentsPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/analytics"
          element={
            <RequireSession>
              <AnalyticsPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/admin/price-imports"
          element={
            <RequireSession>
              <PriceImportsPage />
            </RequireSession>
          }
        />
        <Route
          path="/app/admin/masters"
          element={
            <RequireSession>
              <AdminMastersPage />
            </RequireSession>
          }
        />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
