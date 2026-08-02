import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function AppLayout() {
    return (
        <div>
            <Sidebar />

            <div>
                <TopNavbar />

                <Outlet />
            </div>
        </div>
    );
}