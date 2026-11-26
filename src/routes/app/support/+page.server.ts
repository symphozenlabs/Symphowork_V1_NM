import { error } from "@sveltejs/kit";
import { AppError, isMissingRelationError } from "@/lib/errors";
import { staffIdentity } from "$lib/server/support-http";
import {
  listMySupportWorkspace,
  getMySupportSubmission,
  getMySupportAnnouncement,
} from "@/modules/platform/support-communication";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, url, depends }) => {
  await parent();
  depends("app:support:workspace");
  const actor = await staffIdentity();
  const submissionId = url.searchParams.get("submission");
  const announcementId = url.searchParams.get("announcement");

  try {
    const workspace = await listMySupportWorkspace({
      ...actor,
    });

    let selected = null;
    let selectedError = "";
    if (submissionId) {
      try {
        selected = await getMySupportSubmission({
          ...actor,
          submissionId,
        });
      } catch (cause) {
        if (cause instanceof AppError && (cause.status === 403 || cause.status === 404)) {
          selectedError =
            "This submission could not be found or you do not have permission to view it.";
        } else {
          throw cause;
        }
      }
    }

    let selectedAnnouncement = null;
    let announcementError = "";
    if (announcementId) {
      const fromWorkspace = workspace.announcements.find(
        (item) => item.id === announcementId
      );
      if (fromWorkspace) {
        selectedAnnouncement = fromWorkspace;
      } else {
        try {
          selectedAnnouncement = await getMySupportAnnouncement({
            ...actor,
            announcementId,
          });
        } catch (cause) {
          if (cause instanceof AppError && (cause.status === 403 || cause.status === 404)) {
            announcementError =
              "This announcement is unavailable or you are not an authorized recipient.";
          } else {
            throw cause;
          }
        }
      }
    }

    return {
      ...workspace,
      selected,
      selectedError,
      selectedAnnouncement,
      announcementError,
    };
  } catch (cause) {
    if (cause instanceof AppError && (cause.status === 403 || cause.status === 404))
      error(cause.status, cause.message);
    if (isMissingRelationError(cause))
      error(503, "Support is unavailable until its database migration is applied.");
    throw cause;
  }
};
