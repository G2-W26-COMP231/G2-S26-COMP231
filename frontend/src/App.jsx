import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import PrivateRoute from "./components/PrivateRoute";

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

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} /> {/* M9 */}
          <Route path="/groups/new" element={<PrivateRoute><CreateGroup /></PrivateRoute>} /> {/* M1 */}

          <Route path="/groups/:groupId" element={<PrivateRoute><GroupWorkspace /></PrivateRoute>} /> {/* M3/M11 */}
          <Route path="/groups/:groupId/invite" element={<PrivateRoute><InviteMembers /></PrivateRoute>} /> {/* M2 */}
          <Route path="/groups/:groupId/members" element={<PrivateRoute><Members /></PrivateRoute>} />
          <Route path="/invitations/:token/accept" element={<PrivateRoute><AcceptInvite /></PrivateRoute>} /> {/* M10 direct-link fallback */}

          <Route path="/groups/:groupId/events" element={<PrivateRoute><Events /></PrivateRoute>} /> {/* M12 */}
          <Route path="/groups/:groupId/events/new" element={<PrivateRoute><CreateEvent /></PrivateRoute>} /> {/* M4 */}
          <Route path="/groups/:groupId/events/:eventId" element={<PrivateRoute><EventDetail /></PrivateRoute>} /> {/* M5/M13 */}

          <Route path="/groups/:groupId/chat" element={<PrivateRoute><Chat /></PrivateRoute>} /> {/* M6/M14/M15/M21 */}
          <Route path="/groups/:groupId/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} /> {/* M7 */}
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          <Route path="*" element={<div className="content-area">Page not found.</div>} />
        </Routes>
      </div>
    </div>
  );
}
