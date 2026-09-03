"use client";

import { deleteContentAction } from "@/app/creator/content/actions";

export default function ContentDeleteButton({ contentId }: { contentId: string }) {
  return <form action={deleteContentAction} onSubmit={(event) => { if (!window.confirm("Eliminar permanentemente esta publicação e o ficheiro associado?")) event.preventDefault(); }}><input type="hidden" name="contentId" value={contentId}/><button className="btn danger" type="submit">Eliminar publicação</button></form>;
}
