/**
 * 쇼케이스 소셜 데이터(좋아요·댓글·공유) — DB↔앱 대응과 무결성 규약.
 *
 * ## 좋아요 (`project_likes`)
 * - **키**: `(project_id, user_id)` 복합 PK — 프로젝트당 사용자 1행.
 * - **집계**: 행 개수 = 좋아요 수. `toggleProjectLike` 가 insert/delete 후 `count` 로 동기화.
 * - **RLS**: 공개 프로젝트에 대해 SELECT; 본인 행만 INSERT/DELETE.
 *
 * ## 댓글 (`project_comments`)
 * - **트리**: `parent_id` → 같은 `project_id` 의 댓글만 부모 가능 (011 마이그레이션·INSERT 정책).
 * - **표시명**: `author_display_name` 은 작성 시점 스냅샷 (프로필 비공개 시에도 목록 표시용).
 * - **집계**: 행 개수 = 댓글·답글 전부 포함.
 * - **RLS**: 공개 프로젝트 댓글 SELECT; 본인 INSERT; DELETE 는 본인 또는 ADMIN(015 마이그레이션).
 *
 * ## 공유 (`project_share_events` + `projects.share_count`)
 * - **UI**: 공유 버튼은 항상 **세부정보 페이지 URL**을 클립보드에 복사한 뒤, 지원 기기에서는 Web Share 시트를 추가로 연다 (갤러리·상세 동일).
 * - **이벤트 로그**: append-only. 채널은 `ProjectShareChannel` 만 허용 (`navigate_detail` 은 과거 이벤트용).
 * - **삽입**: 테이블 직접 쓰기 없이 `record_project_share` RPC 만 사용 (SECURITY DEFINER).
 * - **집계**: 트리거가 `projects.share_count` 를 +1. 쇼케이스는 `project_social_counts.share_count` 로 조회.
 * - **사용자**: `user_id` 는 로그인 시 채워지고, 비로그인 공유는 NULL.
 *
 * ## 통합 RPC (`project_social_counts`)
 * - 카드 그리드용: `likes_count`, `comments_count`, `share_count` 를 한 번에 조회.
 */

export const PROJECT_SHARE_CHANNELS = ['native_share', 'clipboard', 'navigate_detail'] as const

export type ProjectShareChannel = (typeof PROJECT_SHARE_CHANNELS)[number]

export function isProjectShareChannel(v: string): v is ProjectShareChannel {
  return (PROJECT_SHARE_CHANNELS as readonly string[]).includes(v)
}
