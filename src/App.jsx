import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import BookingsPage from './pages/BookingsPage';
import CarFormPage from './pages/CarFormPage';
import CarsPage from './pages/CarsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import PaymentsPage from './pages/PaymentsPage';
import UsersPage from './pages/UsersPage';
import WhyChooseUsPage from './pages/WhyChooseUsPage';
import VehicleCategoriesPage from './pages/VehicleCategoriesPage';
import SeoContentPage from './pages/SeoContentPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="cars" element={<CarsPage />} />
              <Route path="cars/new" element={<CarFormPage />} />
              <Route path="cars/:id" element={<CarFormPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="content/vehicle-categories" element={<VehicleCategoriesPage />} />
              <Route path="content/why-choose-us" element={<WhyChooseUsPage />} />
              <Route path="content/seo" element={<SeoContentPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
