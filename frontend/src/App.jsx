import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import BackgroundFX from "./components/BackgroundFX";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import GroupWorkspace from "./pages/GroupWorkspace";
import InviteMembers from "./pages/InviteMembers";
import AcceptInvite from "./pages/AcceptInvite";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import Chat from "./pages/Chat";
import Expenses from "./pages/Expenses";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminReports from "./pages/admin/AdminReports";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminGroups from "./pages/admin/AdminGroups";
import AdminGroupDetail from "./pages/admin/AdminGroupDetail";
import AdminLogs from "./pages/admin/AdminLogs";

export default function App() {
  return (
    <>
      <BackgroundFX />
      <div className="app-layout">
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} /> {/* M9 */}
            <Route path="/groups/new" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />

            <Route path="/groups/:groupId" element={<PrivateRoute><GroupWorkspace /></PrivateRoute>} />
            <Route path="/groups/:groupId/invite" element={<PrivateRoute><InviteMembers /></PrivateRoute>} />
            <Route path="/groups/:groupId/members" element={<PrivateRoute><Members /></PrivateRoute>} />
            <Route path="/invitations/:token/accept" element={<PrivateRoute><AcceptInvite /></PrivateRoute>} />

            <Route path="/groups/:groupId/events" element={<PrivateRoute><Events /></PrivateRoute>} />
            <Route path="/groups/:groupId/events/new" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
            <Route path="/groups/:groupId/events/:eventId" element={<PrivateRoute><EventDetail /></PrivateRoute>} />

            <Route path="/groups/:groupId/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/groups/:groupId/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
            <Route path="/admin/groups" element={<AdminRoute><AdminGroups /></AdminRoute>} />
            <Route path="/admin/groups/:groupId" element={<AdminRoute><AdminGroupDetail /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />

            <Route path="*" element={<div className="content-area">Page not found.</div>} />
          </Routes>
        </div>
      </div>
    </>
  );
}