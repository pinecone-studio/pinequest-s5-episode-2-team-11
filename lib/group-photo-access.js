export function groupPhotoPermissions(group, userId) {
  const isOwner = group?.owner_id === userId;
  const members = group?.friend_group_members ?? group?.members ?? [];
  const isMember = isOwner || members.some((member) => member.member_id === userId);

  return {
    canView: Boolean(isMember),
    canPost: Boolean(isMember),
    canDeleteAny: Boolean(isOwner),
  };
}
