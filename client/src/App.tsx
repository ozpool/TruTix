import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireWallet } from "./components/RequireWallet";
import { Landing } from "./pages/Landing";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Me } from "./pages/Me";
import { TicketPass } from "./pages/TicketPass";
import { Placeholder } from "./pages/Placeholder";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:eventId" element={<EventDetail />} />
        <Route path="resale" element={<Placeholder title="Resale marketplace" />} />

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
              <Placeholder title="My resale listings" />
            </RequireWallet>
          }
        />

        <Route path="org/*" element={<Placeholder title="Organizer" />} />
        <Route path="scan" element={<Placeholder title="Staff scanner" />} />
        <Route path="scan/log" element={<Placeholder title="Redemption log" />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Route>
    </Routes>
  );
}
