// client/src/app/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./App";
import RequireRole from "../components/RequireRole";
import CheckoutPage from "../pages/public/CheckoutPage";
import HomePage from "../pages/public/HomePage";
import ProductsPage from "../pages/public/ProductsPage";
import ProductDetailPage from "../pages/public/ProductDetailPage";
import CartPage from "../pages/public/CartPage";
import CheckoutSuccess from "../pages/public/CheckoutSuccess";
import OrdersPagePublic from "../pages/public/OrdersPage";
import LoginPage from "../pages/public/LoginPage";
import SignUpPage from "../pages/public/SignUpPage";
import WhyChooseUs from "../pages/public/WhyChooseUs";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AddProductPage from "../pages/admin/AddProductPage";
import EditProductPage from "../pages/admin/EditProductPage";
import OrdersPageAdmin from "../pages/admin/OrdersPage";

const NotFound = () => <div>404 - Page Not Found</div>;

export const makeRouter = (products, addProduct) =>
  createBrowserRouter(
    [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "products", element: <ProductsPage products={products} /> },
          { path: "product/:id", element: <ProductDetailPage products={products} /> },
          { path: "cart", element: <CartPage /> },
          { path: "checkout-success", element: <CheckoutSuccess /> },
          { path: "orders", element: <OrdersPagePublic /> },
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignUpPage /> },
          { path: "why-choose-us", element: <WhyChooseUs /> },
          { path: "/checkout", element: <CheckoutPage /> },

          {
            path: "admin",
            element: (
              <RequireRole role="admin">
                <AdminDashboard products={products} addProduct={addProduct} />
              </RequireRole>
            ),
          },
          {
            path: "admin/add",
            element: (
              <RequireRole role="admin">
                <AddProductPage />
              </RequireRole>
            ),
          },
          {
            path: "admin/edit/:id",
            element: (
              <RequireRole role="admin">
                <EditProductPage />
              </RequireRole>
            ),
          },
          {
            path: "admin/orders",
            element: (
              <RequireRole role="admin">
                <OrdersPageAdmin />
              </RequireRole>
            ),
          },

          { path: "*", element: <NotFound /> },
        ],
      },
    ],
    {
      future: { v7_startTransition: true, v7_relativeSplatPath: true },
    }
  );
