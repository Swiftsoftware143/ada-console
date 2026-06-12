import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "sonner";

const TOAST_OPTIONS = {
  style: {
    background: "#1e2130",
    border: "1px solid #2e3245",
    color: "#f8fafc",
  },
};

export default function Layout(): JSX.Element {
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#f8fafc]">
      <Sidebar />
      <main className="md:pl-64 min-h-screen">
        <div className="px-5 py-6 md:px-10 md:py-10 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={TOAST_OPTIONS}
      />
    </div>
  );
}
