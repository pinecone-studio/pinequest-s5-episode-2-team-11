import { describe, expect, it } from "bun:test";
import { groupPhotoPermissions } from "./group-photo-access.js";

const group = (members = []) => ({
  owner_id: "owner",
  members: members.map((member_id) => ({ member_id })),
});

describe("group photo access", () => {
  it("allows a current group member to view and post photos", () => {
    expect(groupPhotoPermissions(group(["member"]), "member")).toEqual({
      canView: true,
      canPost: true,
      canDeleteAny: false,
    });
  });

  it("blocks non-members from viewing or posting", () => {
    expect(groupPhotoPermissions(group(["member"]), "stranger")).toEqual({
      canView: false,
      canPost: false,
      canDeleteAny: false,
    });
  });

  it("revokes access when membership is removed", () => {
    const members = ["member"];
    expect(groupPhotoPermissions(group(members), "member").canView).toBe(true);
    members.splice(0, 1);
    expect(groupPhotoPermissions(group(members), "member").canView).toBe(false);
  });

  it("grants access to past group photos when a user joins", () => {
    const members = [];
    expect(groupPhotoPermissions(group(members), "new-member").canView).toBe(false);
    members.push("new-member");
    expect(groupPhotoPermissions(group(members), "new-member").canView).toBe(true);
  });

  it("allows the owner to delete any group photo", () => {
    expect(groupPhotoPermissions(group(["member"]), "owner").canDeleteAny).toBe(true);
  });
});
