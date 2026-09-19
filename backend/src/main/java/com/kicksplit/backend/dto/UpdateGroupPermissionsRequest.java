package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.ResultEntryPermission;
import com.kicksplit.backend.entity.TeamGenerationPermission;
import com.kicksplit.backend.entity.TeamRegenerationMode;

public record UpdateGroupPermissionsRequest(
        Long userId,
        TeamGenerationPermission teamGenerationPermission,
        TeamRegenerationMode teamRegenerationMode,
        ResultEntryPermission resultEntryPermission) {
}