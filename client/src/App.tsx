import { Routes, Route, Outlet } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireWallet } from "./components/RequireWallet";
import { RequireOrganizer } from "./components/RequireOrganizer";
import { Dashboard } from "./pages/org/Dashboard";
import { CreateEvent } from "./pages/org/CreateEvent";
import { Staff } from "./pages/org/Staff";
import { Landing } from "./pages/Landing";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Me } from "./pages/Me";
import { TicketPass } from "./pages/TicketPass";
import { Scan } from "./pages/Scan";
import { RedemptionLog } from "./pages/RedemptionLog";
import { Resale } from "./pages/Resale";
import { MyListings } from "./pages/MyListings";
import { Whitepaper } from "./pages/Whitepaper";
import { Placeholder } from "./pages/Placeholder";
import { useLiveSync } from "./hooks/useLiveSync";

export function App() {
  useLiveSync();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:eventId" element={<EventDetail />} />
        <Route path="resale" element={<Resale />} />

        <Route
          path="me"
          element={
            <RequireWallet>
              <Me />
            </RequireWallet>
          }
        />
        <Route
          path="me/:tokenId"
          element={
            <RequireWallet>
              <TicketPass />
            </RequireWallet>
          }
        />
        <Route
          path="me/listings"
          element={
            <RequireWallet>
              <MyListings />
            </RequireWallet>
          }
        />

        <Route
          path="org"
          element={
            <RequireOrganizer>
              <Outlet />
            </RequireOrganizer>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="new" element={<CreateEvent />} />
          <Route path="staff" element={<Staff />} />
        </Route>

        <Route path="scan" element={<Scan />} />
        <Route path="scan/log" element={<RedemptionLog />} />
        <Route path="whitepaper" element={<Whitepaper />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Route>
    </Routes>
  );
}
