// App.js - Final Working Version
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout.jsx";
import EmployeeLayout from "./components/EmployeeLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import OrderManagePage from "./pages/OrderManagePage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.jsx";
import ReturnPage from "./pages/ReturnPage.jsx";
import ReturnManagePage from "./pages/ReturnManagePage.jsx";
import ReturnHistoryPage from "./pages/ReturnHistoryPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage.jsx";
import EmployeeOrderPage from "./pages/EmployeeOrderPage.jsx";
import EmployeeReturnPage from "./pages/EmployeeReturnPage.jsx";
import AdminPerformancePage from "./pages/AdminPerformancePage.jsx";
import EmployeeRecordPage from "./pages/EmployeeRecordPage.jsx";
import CallingReportPage from "./pages/CallingReportPage.jsx";
import EmployeeCallingPage from "./pages/EmployeeCallingPage.jsx";

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    const loginPath = localStorage.getItem("dashboard_login_path") || "/login";
    return <Navigate to={loginPath} replace />;
  }
  if (user.role === "employee") return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

const AdminLayout = () => (
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
);

const EmployeeOnlyLayout = () => (
  <ProtectedRoute role="employee">
    <EmployeeLayout />
  </ProtectedRoute>
);

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/admin" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<OrderPage />} />
          <Route path="/admin/orders/manage" element={<OrderManagePage />} />
          <Route path="/admin/orders/history" element={<OrderHistoryPage />} />
          <Route path="/admin/returns" element={<ReturnPage />} />
          <Route path="/admin/returns/manage" element={<ReturnManagePage />} />
          <Route path="/admin/returns/history" element={<ReturnHistoryPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/register" element={<RegisterPage />} />
          <Route path="/admin/register/:id" element={<RegisterPage />} />
          <Route path="/admin/customers" element={<CustomersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/performance" element={<AdminPerformancePage />} />
          <Route path="/admin/employee-records" element={<EmployeeRecordPage />} />
          <Route path="/admin/calling-report" element={<CallingReportPage />} />
        </Route>
        
        {/* Employee Routes */}
        <Route element={<EmployeeOnlyLayout />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
          <Route path="/employee/orders" element={<EmployeeOrderPage />} />
          <Route path="/employee/returns" element={<EmployeeReturnPage />} />
          <Route path="/employee/calling-report" element={<EmployeeCallingPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;