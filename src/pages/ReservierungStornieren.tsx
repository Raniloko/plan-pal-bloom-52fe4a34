import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarPlus, Loader2, Pencil } from "lucide-react";
import { LoadingState, ManageShell, ReservationTicket, StatusHeader } from "@/components/reservation/ManageShell";
import { callGuestFunction, type GuestReservation } from "@/lib/guestReservation";

type ViewState = "loading" | "confirm" | "success" | "error" | "already" | "handled";

const ReservierungStornieren = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [view, setView] = useState<ViewState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [reservation, setReservation] = useState<GuestReservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // 410 = already cancelled, 403 = link invalidated because the team handled the booking
  const handleFailure = (status: number, data: { status?: string } | null, error?: string, fallback = "Reservierung nicht gefunden.") => {
    if (data?.status === "cancelled" || status === 410) setView("already");
    else if (status === 403) setView("handled");
    else { setErrorMsg(error || fallback); setView("error"); }
  };

  useEffect(() => {
    if (!id || !token) {
      setErrorMsg("Dieser Link ist unvollständig. Bitte öffne ihn direkt aus deiner Bestätigungs-E-Mail.");
      setView("error");
      return;
    }
    (async () => {
      const res = await callGuestFunction<{ reservation: GuestReservation; status?: string }>("cancel-reservation", { action: "get", id, token });
      if (res.status === 200 && res.data?.reservation) {
        setReservation(res.data.reservation);
        setView("confirm");
      } else {
        handleFailure(res.status, res.data, res.error);
      }
    })();
  }, [id, token]);

  const handleCancel = async () => {
    setCancelling(true);
    const res = await callGuestFunction<{ status?: string }>("cancel-reservation", { action: "cancel", id, token });
    setCancelling(false);
    if (res.status === 200) setView("success");
    else handleFailure(res.status, res.data, res.error, "Die Stornierung hat leider nicht geklappt. Bitte versuche es erneut.");
  };

  const changeUrl = `/reservierung/aendern?id=${encodeURIComponent(id || "")}&token=${encodeURIComponent(token || "")}`;
  const firstName = reservation?.customer_name?.split(" ")[0];

  return (
    <ManageShell reference={id}>
      {view === "loading" && <LoadingState />}

      {view === "confirm" && reservation && (
        <>
          <StatusHeader tone="warn" title="Reservierung stornieren?">
            {firstName ? `Hallo ${firstName}, ` : ""}möchtest du diese Reservierung wirklich stornieren? Das kann nicht rückgängig gemacht werden.
          </StatusHeader>
          <div className="mt-6">
            <ReservationTicket r={reservation} />
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center justify-center gap-2 rounded-md bg-destructive px-6 py-3 font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {cancelling && <Loader2 size={16} className="animate-spin" />}
              {cancelling ? "Wird storniert…" : "Ja, Reservierung stornieren"}
            </button>
            <Link
              to={changeUrl}
              className="flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-semibold transition-colors hover:border-primary/60"
            >
              <Pencil size={16} /> Lieber ändern statt stornieren
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Du möchtest die Reservierung behalten? Dann musst du nichts tun – schließe einfach diese Seite.
          </p>
        </>
      )}

      {view === "success" && (
        <>
          <StatusHeader tone="success" title="Reservierung storniert">
            Schade, dass es diesmal nicht klappt. Eine Bestätigung haben wir dir per E-Mail geschickt.
          </StatusHeader>
          {reservation && <div className="mt-6"><ReservationTicket r={reservation} struck /></div>}
          <Link
            to="/reservierung"
            className="mt-6 flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CalendarPlus size={16} /> Neu reservieren
          </Link>
        </>
      )}

      {view === "already" && (
        <>
          <StatusHeader tone="info" title="Bereits storniert">
            Diese Reservierung wurde bereits storniert. Du musst nichts weiter tun.
          </StatusHeader>
          <Link to="/reservierung" className="mt-6 flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
            Neu reservieren
          </Link>
        </>
      )}

      {view === "handled" && (
        <StatusHeader tone="info" title="Bereits vom Team bearbeitet">
          Diese Reservierung hat unser Team bereits bearbeitet, deshalb kann sie hier nicht mehr storniert werden.
          Bitte melde dich direkt bei uns im Rondo, wenn du etwas ändern möchtest.
        </StatusHeader>
      )}

      {view === "error" && (
        <>
          <StatusHeader tone="danger" title="Das hat nicht geklappt">{errorMsg}</StatusHeader>
          <Link to="/reservierung" className="mt-6 flex items-center justify-center rounded-md border border-border px-6 py-3 font-semibold hover:border-primary/60">
            Zur Reservierung
          </Link>
        </>
      )}
    </ManageShell>
  );
};

export default ReservierungStornieren;
