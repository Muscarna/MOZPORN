import { toggleFollow } from "@/app/creator/follow-actions";

export default function CreatorFollowButton({ creatorId, isFollowing }: { creatorId: string; isFollowing: boolean }) {
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="creatorId" value={creatorId} />
      <button className="btn primary" type="submit">{isFollowing ? "Deixar de seguir" : "Seguir"}</button>
    </form>
  );
}
