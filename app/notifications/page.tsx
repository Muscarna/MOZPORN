import Header from "@/components/Header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><Header/><main><section className="page-title"><span className="badge">AVISOS</span><h1>Notificações</h1><p>Atualizações importantes sobre a sua conta e conteúdos.</p></section>{notifications.some((item) => !item.readAt) ? <form action={markAllNotificationsReadAction} className="notification-tools"><button className="btn secondary">Marcar todas como lidas</button></form> : null}<section className="notification-list">{notifications.length === 0 ? <div className="empty-state">Ainda não existem notificações.</div> : notifications.map((item) => <article className={item.readAt ? "notification-card" : "notification-card unread"} key={item.id}><div><span className="badge">{item.type}</span><h2>{item.title}</h2><p>{item.message}</p><small>{item.createdAt.toLocaleString("pt-PT")}</small></div>{item.href ? <form action={markNotificationReadAction}><input type="hidden" name="notificationId" value={item.id}/><button className="btn secondary">Abrir</button></form> : null}</article>)}</section></main></>;
}
