import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout() {
  return (
    <div className="admin-layout">

      <Sidebar />

      <div className="admin-main">

        <Header />

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}