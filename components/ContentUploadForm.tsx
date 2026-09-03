"use client";

import { upload } from "@vercel/blob/client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContentUploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Selecione uma foto ou vídeo.");
      setBusy(false);
      return;
    }

    try {
      const draftResponse = await fetch("/api/content/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          visibility: form.get("visibility"),
          tags: form.get("tags"),
          uploaderAdult: form.get("uploaderAdult") === "on",
          allParticipantsAdults: form.get("allParticipantsAdults") === "on",
          consentObtained: form.get("consentObtained") === "on",
          distributionRights: form.get("distributionRights") === "on",
        }),
      });
      const draft = await draftResponse.json();
      if (!draftResponse.ok) throw new Error(draft.error ?? "Não foi possível criar o rascunho.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      await upload(`content/${draft.id}/${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/blob/upload",
        clientPayload: draft.id,
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      router.push("/creator?uploaded=1");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha no upload.");
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      {error ? <div className="error">{error}</div> : null}
      <label>Título<input name="title" minLength={3} maxLength={100} required /></label>
      <label>Descrição<textarea name="description" maxLength={2000} rows={5} /></label>
      <label>Etiquetas<input name="tags" maxLength={200} placeholder="ex.: novidades, fotografia, vídeo" /></label>
      <p className="small">Até 8 etiquetas, separadas por vírgulas.</p>
      <label>Visibilidade
        <select name="visibility" defaultValue="PUBLIC">
          <option value="PUBLIC">Público para membros</option>
          <option value="FOLLOWERS">Seguidores</option>
          <option value="SUBSCRIBERS">Assinantes e Premium</option>
          <option value="PRIVATE">Privado</option>
        </select>
      </label>
      <label>Foto ou vídeo
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required />
      </label>
      <p className="small">Formatos: JPG, PNG, WebP, MP4 ou WebM. Limite: 500 MB.</p>
      <fieldset className="attestation-box"><legend>Declarações obrigatórias</legend><label className="checkbox"><input type="checkbox" name="uploaderAdult" required/> Confirmo que tenho 18 anos ou mais.</label><label className="checkbox"><input type="checkbox" name="allParticipantsAdults" required/> Todas as pessoas representadas tinham 18 anos ou mais na data da gravação.</label><label className="checkbox"><input type="checkbox" name="consentObtained" required/> Todas as pessoas consentiram na gravação e publicação.</label><label className="checkbox"><input type="checkbox" name="distributionRights" required/> Tenho autorização e direitos para distribuir este conteúdo.</label></fieldset>
      <button className="btn primary full" disabled={busy}>{busy ? `Enviando… ${progress}%` : "Enviar para moderação"}</button>
    </form>
  );
}
