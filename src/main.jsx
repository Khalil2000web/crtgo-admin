import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AdminI18nProvider } from "./lib/adminI18n";

import App from "./App.jsx";
import { ConfirmProvider } from "./components/ConfirmProvider.jsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminI18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfirmProvider>
            <App />

            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#111111",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: "16px",
                  fontWeight: 800,
                },
                success: {
                  iconTheme: {
                    primary: "#ff7a00",
                    secondary: "#000000",
                  },
                },
              }}
            />
          </ConfirmProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AdminI18nProvider>
  </React.StrictMode>
);