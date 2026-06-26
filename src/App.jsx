import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import GetStarted from './pages/GetStarted.jsx'
import RegisterCustomer from './pages/RegisterCustomer.jsx'
import RegisterSeller from './pages/RegisterSeller.jsx'
import Login from './pages/Login.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import SellerDashboard from './pages/SellerDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import MessageThread from './pages/MessageThread.jsx'
import Cart from './pages/Cart.jsx'
import CustomerOrders from './pages/CustomerOrders.jsx'
import CustomerMessages from './pages/CustomerMessages.jsx'
import CustomerAccount from './pages/CustomerAccount.jsx'
import OnboardingGate from './components/onboarding/OnboardingGate.jsx'

function App() {
  return (
    <OnboardingGate>
      <Routes>
        <Route path="/customer/messages" element={<CustomerMessages />} />
        <Route path="/customer/account" element={<CustomerAccount />} />
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/register/customer" element={<RegisterCustomer />} />
        <Route path="/register/seller" element={<RegisterSeller />} />
        <Route path="/login" element={<Login />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/messages/:id" element={<MessageThread />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
      </Routes>
    </OnboardingGate>
  )
}

export default App