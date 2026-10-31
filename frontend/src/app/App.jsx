import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import router from "./router";

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ErrorBoundary>
    );
}
